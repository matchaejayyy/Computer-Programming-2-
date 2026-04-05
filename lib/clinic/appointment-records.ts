import { existsSync, readFileSync, writeFileSync } from "fs";
import { spawn, spawnSync } from "child_process";
import { join } from "path";

import { appointmentMatchesSearch } from "@/lib/clinic/admin-appointment-search";
import type { RequestStatus } from "@/lib/clinic/mock-requests";
import { searchAppointmentLineNumbersCpp } from "@/lib/clinic/cpp-search-appointments";

export const APPOINTMENTS_DB_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "appointments.db"
);

export type RawAppointmentRecord = {
  id?: number;
  studentName: string;
  email: string;
  address: string;
  reason: string;
  otherReasonDetail?: string;
  preferredDate: string;
  preferredTime: string;
  submittedAt?: string;
  status?: RequestStatus;
  adminNote?: string;
  reviewedAt?: string;
  schoolIdNumber?: string;
};

export type StoredAppointment = {
  updateId: number;
  record: RawAppointmentRecord;
};

function readNonemptyLines(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, "utf8")
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function effectiveUpdateIdFromLine(
  record: RawAppointmentRecord,
  lineIndex1: number
): number {
  return typeof record.id === "number" && record.id > 0 ? record.id : lineIndex1;
}

function recordStatus(record: RawAppointmentRecord): RequestStatus {
  const s = record.status;
  if (s === "approved" || s === "rejected" || s === "pending") {
    return s;
  }
  return "pending";
}

export function readAllStoredAppointments(): StoredAppointment[] {
  const lines = readNonemptyLines(APPOINTMENTS_DB_PATH);
  const out: StoredAppointment[] = [];
  lines.forEach((line, i) => {
    try {
      const record = JSON.parse(line) as RawAppointmentRecord;
      out.push({
        updateId: effectiveUpdateIdFromLine(record, i + 1),
        record,
      });
    } catch {
      /* skip malformed */
    }
  });
  return out;
}

function listStoredAppointmentsFromListBinary(
  filter: "all" | "pending" | "approved" | "rejected"
): StoredAppointment[] | null {
  const binary =
    process.platform === "win32" ? "list_appointments.exe" : "list_appointments";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const result = spawnSync(executable, [APPOINTMENTS_DB_PATH, filter], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error || result.status !== 0 || result.stdout == null) {
    return null;
  }

  try {
    const data = JSON.parse(result.stdout.trim()) as {
      lineNumbers?: unknown;
      appointments?: unknown;
    };
    if (!Array.isArray(data.lineNumbers) || !Array.isArray(data.appointments)) {
      return null;
    }
    if (data.lineNumbers.length !== data.appointments.length) {
      return null;
    }

    const out: StoredAppointment[] = [];
    for (let i = 0; i < data.lineNumbers.length; i++) {
      const n = data.lineNumbers[i];
      if (typeof n !== "number" || !Number.isFinite(n) || n < 1) {
        return null;
      }
      const rec = data.appointments[i];
      if (!rec || typeof rec !== "object") {
        return null;
      }
      const record = rec as RawAppointmentRecord;
      out.push({
        updateId: effectiveUpdateIdFromLine(record, n),
        record,
      });
    }
    return out;
  } catch {
    return null;
  }
}

export function listStoredAppointments(
  filter: "all" | "pending" | "approved" | "rejected"
): StoredAppointment[] {
  const viaCpp = listStoredAppointmentsFromListBinary(filter);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const all = readAllStoredAppointments();
  if (filter === "all") {
    return all;
  }
  return all.filter(({ record }) => recordStatus(record) === filter);
}

/**
 * Status filter + optional text search. Uses C++ search_appointments when the binary exists;
 * otherwise filters in TypeScript (same matching rules).
 */
export function listStoredAppointmentsWithSearch(
  filter: "all" | "pending" | "approved" | "rejected",
  query: string
): StoredAppointment[] {
  const q = query.trim();
  const base = listStoredAppointments(filter);
  if (!q) {
    return base;
  }

  const lineNums = searchAppointmentLineNumbersCpp(APPOINTMENTS_DB_PATH, filter, q);
  if (lineNums !== null) {
    const want = new Set(lineNums);
    const lines = readNonemptyLines(APPOINTMENTS_DB_PATH);
    const out: StoredAppointment[] = [];
    lines.forEach((line, i) => {
      const n = i + 1;
      if (!want.has(n)) {
        return;
      }
      try {
        const record = JSON.parse(line) as RawAppointmentRecord;
        out.push({
          updateId: effectiveUpdateIdFromLine(record, n),
          record,
        });
      } catch {
        /* skip malformed */
      }
    });
    return out;
  }

  return base.filter((item) => appointmentMatchesSearch(toAppointmentRequestView(item), q));
}

function runCppUpdateAppointment(
  updateId: number,
  status: RequestStatus,
  adminNote: string
): Promise<boolean> {
  const binary =
    process.platform === "win32" ? "update_appointment.exe" : "update_appointment";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return Promise.resolve(false);
  }

  const stdin = `${updateId}\n${status}\n${adminNote}\n`;

  return new Promise((resolve) => {
    const child = spawn(executable, [APPOINTMENTS_DB_PATH], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stderr?.on("data", () => {
      /* stderr ignored; exit code drives fallback */
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
    child.stdin.write(stdin, "utf8");
    child.stdin.end();
  });
}

export function updateAppointmentRecordTypeScript(
  updateId: number,
  status: RequestStatus,
  adminNote: string
): void {
  const lines = readNonemptyLines(APPOINTMENTS_DB_PATH);
  if (lines.length === 0) {
    throw new Error("No appointments database.");
  }

  const next = [...lines];
  let found = false;
  const reviewedAt = new Date().toISOString();

  for (let i = 0; i < next.length; i++) {
    try {
      const record = JSON.parse(next[i]) as RawAppointmentRecord;
      const eff = effectiveUpdateIdFromLine(record, i + 1);
      if (eff !== updateId) {
        continue;
      }
      record.status = status;
      record.adminNote = adminNote;
      record.reviewedAt = reviewedAt;
      next[i] = JSON.stringify(record);
      found = true;
      break;
    } catch {
      /* continue */
    }
  }

  if (!found) {
    throw new Error("No appointment with that id.");
  }

  writeFileSync(APPOINTMENTS_DB_PATH, next.join("\n") + "\n", "utf8");
}

export async function updateAppointmentRecord(
  updateId: number,
  status: RequestStatus,
  adminNote: string
): Promise<void> {
  const ok = await runCppUpdateAppointment(updateId, status, adminNote);
  if (ok) {
    return;
  }
  updateAppointmentRecordTypeScript(updateId, status, adminNote);
}

export function toAppointmentRequestView(item: StoredAppointment) {
  const { record, updateId } = item;
  const idNum = typeof record.id === "number" ? record.id : updateId;
  const reason =
    record.reason === "others" && record.otherReasonDetail?.trim()
      ? `Others — ${record.otherReasonDetail.trim()}`
      : record.reason;
  const schoolId = record.schoolIdNumber?.trim();

  return {
    id: `REQ-${String(idNum).padStart(4, "0")}`,
    updateId,
    status: recordStatus(record),
    submittedAt: record.submittedAt ?? new Date(0).toISOString(),
    requestedDate: `${record.preferredDate} — ${record.preferredTime}`,
    reason,
    studentName: record.studentName,
    email: record.email,
    address: record.address,
    clinicNote: record.adminNote?.trim() ? record.adminNote : undefined,
    schoolIdNumber: schoolId ? schoolId : undefined,
  };
}

function appointmentStatsTypeScript() {
  const all = readAllStoredAppointments();
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const { record } of all) {
    const s = recordStatus(record);
    if (s === "pending") {
      pending += 1;
    } else if (s === "approved") {
      approved += 1;
    } else {
      rejected += 1;
    }
  }
  return {
    total: all.length,
    pending,
    approved,
    rejected,
  };
}

export function appointmentStats() {
  const binary =
    process.platform === "win32" ? "count_by_status.exe" : "count_by_status";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return appointmentStatsTypeScript();
  }

  const result = spawnSync(executable, [APPOINTMENTS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return appointmentStatsTypeScript();
  }

  try {
    const data = JSON.parse(result.stdout.trim()) as {
      total?: number;
      pending?: number;
      approved?: number;
      rejected?: number;
    };
    if (
      typeof data.total === "number" &&
      typeof data.pending === "number" &&
      typeof data.approved === "number" &&
      typeof data.rejected === "number"
    ) {
      return {
        total: data.total,
        pending: data.pending,
        approved: data.approved,
        rejected: data.rejected,
      };
    }
  } catch {
    /* fall through */
  }

  return appointmentStatsTypeScript();
}
