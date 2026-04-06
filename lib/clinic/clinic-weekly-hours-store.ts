import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { spawn } from "child_process";
import { join } from "path";

import { prisma } from "@/lib/prisma";

import { CLINIC_WEEKLY_HOURS_PATH } from "@/lib/clinic/clinic-paths";
import { WEEKLY_CLINIC_HOURS } from "@/lib/clinic/clinic-schedule";

export type WeeklyHourRow = { label: string; hours: string };

export type WeeklyHoursFile = { rows: WeeklyHourRow[] };

/** Full schedule JSON in DB / disk: weekly rows + reserve-appointment slots + blocked YYYY-MM-DD dates. */
export type ClinicScheduleData = {
  rows: WeeklyHourRow[];
  timeSlots: string[];
  blockedDates: string[];
  slotCapacity: number;
};

const DEFAULT_TIME_SLOTS: string[] = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

const DEFAULT_BLOCKED_DATES: string[] = [];
const DEFAULT_SLOT_CAPACITY = 10;

function defaultWeeklyHours(): WeeklyHourRow[] {
  return WEEKLY_CLINIC_HOURS.map((r) => ({ label: r.label, hours: r.hours }));
}

function normalizeDateList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_BLOCKED_DATES];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) out.push(t);
  }
  return out;
}

function normalizeTimeSlots(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_TIME_SLOTS];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t) out.push(t);
  }
  return out.length > 0 ? out : [...DEFAULT_TIME_SLOTS];
}

function normalizeSlotCapacity(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SLOT_CAPACITY;
  const v = Math.floor(n);
  if (v < 1) return DEFAULT_SLOT_CAPACITY;
  return v;
}

function parseRowsOnly(content: string): WeeklyHourRow[] {
  try {
    const data = JSON.parse(content) as WeeklyHoursFile;
    if (!data || !Array.isArray(data.rows)) {
      return defaultWeeklyHours();
    }
    return data.rows
      .filter(
        (r) =>
          r &&
          typeof r.label === "string" &&
          typeof r.hours === "string" &&
          r.label.trim() &&
          r.hours.trim()
      )
      .map((r) => ({ label: r.label.trim(), hours: r.hours.trim() }));
  } catch {
    return defaultWeeklyHours();
  }
}

export function parseScheduleJson(content: string): ClinicScheduleData {
  try {
    const data = JSON.parse(content) as Record<string, unknown>;
    const rowsRaw = data?.rows;
    let rows: WeeklyHourRow[];
    if (Array.isArray(rowsRaw)) {
      rows = rowsRaw
        .filter(
          (r) =>
            r &&
            typeof r === "object" &&
            typeof (r as WeeklyHourRow).label === "string" &&
            typeof (r as WeeklyHourRow).hours === "string" &&
            (r as WeeklyHourRow).label.trim() &&
            (r as WeeklyHourRow).hours.trim()
        )
        .map((r) => ({
          label: (r as WeeklyHourRow).label.trim(),
          hours: (r as WeeklyHourRow).hours.trim(),
        }));
      if (rows.length === 0) rows = defaultWeeklyHours();
    } else {
      rows = defaultWeeklyHours();
    }
    return {
      rows,
      timeSlots: normalizeTimeSlots(data?.timeSlots),
      blockedDates: normalizeDateList(data?.blockedDates),
      slotCapacity: normalizeSlotCapacity(data?.slotCapacity),
    };
  } catch {
    return {
      rows: defaultWeeklyHours(),
      timeSlots: [...DEFAULT_TIME_SLOTS],
      blockedDates: [...DEFAULT_BLOCKED_DATES],
      slotCapacity: DEFAULT_SLOT_CAPACITY,
    };
  }
}

export function defaultClinicSchedule(): ClinicScheduleData {
  return {
    rows: defaultWeeklyHours(),
    timeSlots: [...DEFAULT_TIME_SLOTS],
    blockedDates: [...DEFAULT_BLOCKED_DATES],
    slotCapacity: DEFAULT_SLOT_CAPACITY,
  };
}

export async function getClinicScheduleFromDisk(): Promise<ClinicScheduleData> {
  const row = await prisma.clinicWeeklyHours.findUnique({ where: { id: 1 } });
  if (row?.rowsJson) {
    return parseScheduleJson(row.rowsJson);
  }
  if (existsSync(CLINIC_WEEKLY_HOURS_PATH)) {
    try {
      const raw = readFileSync(CLINIC_WEEKLY_HOURS_PATH, "utf8");
      const parsed = parseScheduleJson(raw);
      return parsed.rows.length > 0 ? parsed : defaultClinicSchedule();
    } catch {
      return defaultClinicSchedule();
    }
  }
  return defaultClinicSchedule();
}

export async function getWeeklyClinicHoursFromDisk(): Promise<WeeklyHourRow[]> {
  const s = await getClinicScheduleFromDisk();
  return s.rows;
}

function runCppScheduleSave(jsonBody: string): Promise<boolean> {
  const binary =
    process.platform === "win32" ? "clinic_schedule_tool.exe" : "clinic_schedule_tool";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return Promise.resolve(false);
  }

  const stdin = `SAVE\n${jsonBody}`;

  return new Promise((resolve) => {
    const child = spawn(executable, [CLINIC_WEEKLY_HOURS_PATH], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
    child.stdin.write(stdin, "utf8");
    child.stdin.end();
  });
}

async function persistSchedule(data: ClinicScheduleData): Promise<void> {
  const body = JSON.stringify(data, null, 2) + "\n";
  await prisma.clinicWeeklyHours.upsert({
    where: { id: 1 },
    create: { id: 1, rowsJson: JSON.stringify(data) },
    update: { rowsJson: JSON.stringify(data) },
  });
  const ok = await runCppScheduleSave(body);
  if (!ok) {
    mkdirSync(dirname(CLINIC_WEEKLY_HOURS_PATH), { recursive: true });
    writeFileSync(CLINIC_WEEKLY_HOURS_PATH, body, "utf8");
  }
}

export async function saveClinicSchedule(data: ClinicScheduleData): Promise<void> {
  await persistSchedule(data);
}

export async function saveWeeklyClinicHours(rows: WeeklyHourRow[]): Promise<void> {
  const current = await getClinicScheduleFromDisk();
  await persistSchedule({ ...current, rows });
}

export function validatePreferredSlot(
  preferredDate: string,
  preferredTime: string,
  schedule: ClinicScheduleData
): { ok: true } | { ok: false; message: string } {
  const d = preferredDate.trim();
  const t = preferredTime.trim();
  if (schedule.blockedDates.includes(d)) {
    return { ok: false, message: "That date is unavailable (blocked by the clinic)." };
  }
  if (!schedule.timeSlots.includes(t)) {
    return { ok: false, message: "That time is not an available slot." };
  }
  return { ok: true };
}
