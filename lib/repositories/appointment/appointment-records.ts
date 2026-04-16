import { existsSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

import { appointmentMatchesSearch } from "@/lib/repositories/appointment/admin-appointment-search";
import { updateAppointmentInDb } from "@/lib/repositories/appointment/appointment-db";
import { APPOINTMENTS_DB_PATH } from "@/lib/repositories/schedule/clinic-paths";
import type { RequestStatus } from "@/lib/utils/constants/mock-requests";
import { preferredDateToIso } from "@/lib/utils/constants/preferred-date-iso";
import { prisma } from "@/lib/prisma";
import type { AppointmentStatus } from "@prisma/client";

export type AppointmentListFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "no_show"
  | "completed";

export { APPOINTMENTS_DB_PATH };

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
  if (
    s === "approved" ||
    s === "rejected" ||
    s === "pending" ||
    s === "cancelled" ||
    s === "no_show" ||
    s === "completed"
  ) {
    return s;
  }
  return "pending";
}

function filterStoredByDateIso(
  items: StoredAppointment[],
  dateIso: string | undefined
): StoredAppointment[] {
  if (!dateIso?.trim()) {
    return items;
  }
  const want = dateIso.trim();
  return items.filter((item) => preferredDateToIso(item.record.preferredDate) === want);
}

function readAllStoredAppointmentsFromDisk(): StoredAppointment[] {
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

async function readAllStoredAppointmentsFromDb(): Promise<StoredAppointment[]> {
  const rows = await prisma.appointment.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      studentName: true,
      email: true,
      address: true,
      reason: true,
      otherReasonDetail: true,
      preferredDate: true,
      preferredTime: true,
      submittedAt: true,
      status: true,
      adminNote: true,
      reviewedAt: true,
      schoolIdNumber: true,
    },
  });
  return rows.map((r) => ({
    updateId: r.id,
    record: {
      id: r.id,
      studentName: r.studentName,
      email: r.email,
      address: r.address,
      reason: r.reason,
      otherReasonDetail: r.otherReasonDetail || undefined,
      preferredDate: r.preferredDate,
      preferredTime: r.preferredTime,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status as RequestStatus,
      adminNote: r.adminNote || undefined,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
      schoolIdNumber: r.schoolIdNumber?.trim() || undefined,
    },
  }));
}

export async function readAllStoredAppointments(): Promise<StoredAppointment[]> {
  return readAllStoredAppointmentsFromDb();
}

function listStoredAppointmentsFromListBinary(
  filter: AppointmentListFilter
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

function listStoredAppointmentsFromDisk(filter: AppointmentListFilter): StoredAppointment[] {
  const viaCpp = listStoredAppointmentsFromListBinary(filter);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const all = readAllStoredAppointmentsFromDisk();
  if (filter === "all") {
    return all;
  }
  return all.filter(({ record }) => recordStatus(record) === filter);
}

export async function listStoredAppointments(
  filter: AppointmentListFilter
): Promise<StoredAppointment[]> {
  const where = filter === "all" ? {} : { status: filter as AppointmentStatus };
  const rows = await prisma.appointment.findMany({
    where,
    orderBy: { id: "asc" },
    select: {
      id: true,
      studentName: true,
      email: true,
      address: true,
      reason: true,
      otherReasonDetail: true,
      preferredDate: true,
      preferredTime: true,
      submittedAt: true,
      status: true,
      adminNote: true,
      reviewedAt: true,
      schoolIdNumber: true,
    },
  });
  return rows.map((r) => ({
    updateId: r.id,
    record: {
      id: r.id,
      studentName: r.studentName,
      email: r.email,
      address: r.address,
      reason: r.reason,
      otherReasonDetail: r.otherReasonDetail || undefined,
      preferredDate: r.preferredDate,
      preferredTime: r.preferredTime,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status as RequestStatus,
      adminNote: r.adminNote || undefined,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
      schoolIdNumber: r.schoolIdNumber?.trim() || undefined,
    },
  }));
}

/**
 * Status filter + optional text search. Uses C++ search_appointments when the binary exists;
 * otherwise filters in TypeScript (same matching rules).
 */
export async function listStoredAppointmentsWithSearch(
  filter: AppointmentListFilter,
  query: string,
  dateIso?: string
): Promise<StoredAppointment[]> {
  const where: Record<string, unknown> = {};
  if (filter !== "all") {
    where.status = filter;
  }
  const rows = await prisma.appointment.findMany({
    where,
    orderBy: { id: "asc" },
    select: {
      id: true,
      studentName: true,
      email: true,
      address: true,
      reason: true,
      otherReasonDetail: true,
      preferredDate: true,
      preferredTime: true,
      submittedAt: true,
      status: true,
      adminNote: true,
      reviewedAt: true,
      schoolIdNumber: true,
    },
  });
  let items: StoredAppointment[] = rows.map((r) => ({
    updateId: r.id,
    record: {
      id: r.id,
      studentName: r.studentName,
      email: r.email,
      address: r.address,
      reason: r.reason,
      otherReasonDetail: r.otherReasonDetail || undefined,
      preferredDate: r.preferredDate,
      preferredTime: r.preferredTime,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status as RequestStatus,
      adminNote: r.adminNote || undefined,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : undefined,
      schoolIdNumber: r.schoolIdNumber?.trim() || undefined,
    },
  }));
  const q = query.trim();
  if (q) {
    items = items.filter((item) => appointmentMatchesSearch(toAppointmentRequestView(item), q));
  }
  return filterStoredByDateIso(items, dateIso);
}

export async function updateAppointmentRecord(
  updateId: number,
  status: RequestStatus,
  adminNote: string
): Promise<void> {
  await updateAppointmentInDb(updateId, status, adminNote);
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

async function appointmentStatsFromDb() {
  const rows = await prisma.appointment.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row._count.status;
    total += row._count.status;
  }
  return {
    total,
    pending: counts.pending ?? 0,
    approved: counts.approved ?? 0,
    rejected: counts.rejected ?? 0,
    cancelled: counts.cancelled ?? 0,
    no_show: counts.no_show ?? 0,
    completed: counts.completed ?? 0,
  };
}

function appointmentStatsTypeScript() {
  const all = readAllStoredAppointmentsFromDisk();
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let cancelled = 0;
  let no_show = 0;
  let completed = 0;
  for (const { record } of all) {
    const s = recordStatus(record);
    if (s === "pending") {
      pending += 1;
    } else if (s === "approved") {
      approved += 1;
    } else if (s === "rejected") {
      rejected += 1;
    } else if (s === "cancelled") {
      cancelled += 1;
    } else if (s === "no_show") {
      no_show += 1;
    } else {
      completed += 1;
    }
  }
  return {
    total: all.length,
    pending,
    approved,
    rejected,
    cancelled,
    no_show,
    completed,
  };
}

export async function appointmentStats() {
  return appointmentStatsFromDb();
}
