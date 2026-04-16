import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";

import { VISITOR_LOGS_DB_PATH } from "@/lib/repositories/schedule/clinic-paths";

export type VisitorLogRecord = {
  id: string;
  name: string;
  email: string;
  department: string;
  course: string;
  year: string;
  time: string;
  purpose: string;
  createdAt: string;
};

type NewVisitorLogInput = Omit<VisitorLogRecord, "id">;

function readNonemptyLines(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }
  return readFileSync(path, "utf8")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listVisitorLogRecordsFromCpp(): VisitorLogRecord[] | null {
  const binary = process.platform === "win32" ? "list_visitor_logs.exe" : "list_visitor_logs";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const result = spawnSync(executable, [VISITOR_LOGS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const data = JSON.parse(result.stdout.trim()) as { logs?: unknown };
    if (!Array.isArray(data.logs)) {
      return null;
    }
    const parsed: VisitorLogRecord[] = [];
    for (const item of data.logs) {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      if (
        typeof row.id !== "string" ||
        typeof row.name !== "string" ||
        typeof row.email !== "string" ||
        typeof row.department !== "string" ||
        typeof row.course !== "string" ||
        typeof row.year !== "string" ||
        typeof row.time !== "string" ||
        typeof row.purpose !== "string" ||
        typeof row.createdAt !== "string"
      ) {
        return null;
      }
      parsed.push({
        id: row.id,
        name: row.name,
        email: row.email,
        department: row.department,
        course: row.course,
        year: row.year,
        time: row.time,
        purpose: row.purpose,
        createdAt: row.createdAt,
      });
    }
    return parsed;
  } catch {
    return null;
  }
}

function createVisitorLogRecordFromCpp(input: NewVisitorLogInput): VisitorLogRecord | null {
  const binary = process.platform === "win32" ? "save_visitor_log.exe" : "save_visitor_log";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const stdinBody = [
    input.name.trim(),
    input.email.trim(),
    input.department.trim(),
    input.course.trim(),
    input.year.trim(),
    input.time.trim(),
    input.purpose.trim(),
    input.createdAt,
    "",
  ].join("\n");

  const result = spawnSync(executable, [VISITOR_LOGS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: stdinBody,
    maxBuffer: 5 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const row = JSON.parse(result.stdout.trim()) as VisitorLogRecord;
    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.email !== "string" ||
      typeof row.department !== "string" ||
      typeof row.course !== "string" ||
      typeof row.year !== "string" ||
      typeof row.time !== "string" ||
      typeof row.purpose !== "string" ||
      typeof row.createdAt !== "string"
    ) {
      return null;
    }
    return row;
  } catch {
    return null;
  }
}

export function listVisitorLogRecords(): VisitorLogRecord[] {
  const viaCpp = listVisitorLogRecordsFromCpp();
  if (viaCpp !== null) {
    return viaCpp.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const lines = readNonemptyLines(VISITOR_LOGS_DB_PATH);
  const out: VisitorLogRecord[] = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as VisitorLogRecord;
      if (
        row &&
        typeof row.id === "string" &&
        typeof row.name === "string" &&
        typeof row.email === "string" &&
        typeof row.department === "string" &&
        typeof row.course === "string" &&
        typeof row.year === "string" &&
        typeof row.time === "string" &&
        typeof row.purpose === "string" &&
        typeof row.createdAt === "string"
      ) {
        out.push(row);
      }
    } catch {
      // Skip malformed lines.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createVisitorLogRecord(input: NewVisitorLogInput): VisitorLogRecord {
  const viaCpp = createVisitorLogRecordFromCpp(input);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const existing = listVisitorLogRecords();
  const nextNumber = existing.length + 1;
  const row: VisitorLogRecord = {
    id: `VLOG-${String(nextNumber).padStart(4, "0")}`,
    name: input.name.trim(),
    email: input.email.trim(),
    department: input.department.trim(),
    course: input.course.trim(),
    year: input.year.trim(),
    time: input.time.trim(),
    purpose: input.purpose.trim(),
    createdAt: input.createdAt,
  };

  try {
    mkdirSync(dirname(VISITOR_LOGS_DB_PATH), { recursive: true });
    appendFileSync(VISITOR_LOGS_DB_PATH, `${JSON.stringify(row)}\n`, "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel) — return the record without persisting to disk.
  }
  return row;
}
