import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { spawn } from "child_process";
import { join } from "path";

import { prisma } from "@/lib/prisma";

import { CLINIC_WEEKLY_HOURS_PATH } from "@/lib/clinic/clinic-paths";
import { WEEKLY_CLINIC_HOURS } from "@/lib/clinic/clinic-schedule";
import { isDateAvailableForSchedule } from "@/lib/clinic/schedule-date-availability";

export type WeeklyHourRow = { label: string; hours: string };

type DateOverride = {
  date: string;
  available: boolean;
};

type DisabledSlotsByDate = Record<string, string[]>;
type SlotCapacityByDateTime = Record<string, Record<string, number>>;

/** Full schedule JSON in DB / disk: weekly rows + reserve-appointment scheduling rules. */
export type ClinicScheduleData = {
  rows: WeeklyHourRow[];
  timeSlots: string[];
  blockedDates: string[];
  slotCapacity: number;
  dateOverrides: DateOverride[];
  disabledSlotsByDate: DisabledSlotsByDate;
  slotCapacityByDateTime: SlotCapacityByDateTime;
};

const DEFAULT_TIME_SLOTS: string[] = generateDefaultTimeSlots(60);

const DEFAULT_BLOCKED_DATES: string[] = [];
const DEFAULT_SLOT_CAPACITY = 10;
const DEFAULT_DATE_OVERRIDES: DateOverride[] = [];
const DEFAULT_DISABLED_SLOTS_BY_DATE: DisabledSlotsByDate = {};
const DEFAULT_CAPACITY_BY_DATE_TIME: SlotCapacityByDateTime = {};

function parseClockToMinutes(value: string): number {
  const [hourRaw, minuteRaw] = value.split(":");
  const h = Number(hourRaw);
  const m = Number(minuteRaw);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return -1;
  if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
}

function formatTo12Hour(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function generateTimeRangeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const out: string[] = [];
  const startM = parseClockToMinutes(start);
  const endM = parseClockToMinutes(end);
  if (startM < 0 || endM < 0 || intervalMinutes < 1 || endM <= startM) return out;
  for (let value = startM; value < endM; value += intervalMinutes) {
    out.push(formatTo12Hour(value));
  }
  return out;
}

function generateDefaultTimeSlots(intervalMinutes: number): string[] {
  const morning = generateTimeRangeSlots("07:00", "11:30", intervalMinutes);
  const afternoon = generateTimeRangeSlots("13:30", "16:00", intervalMinutes);
  return [...morning, ...afternoon];
}

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

function normalizeDateOverrides(raw: unknown): DateOverride[] {
  if (!Array.isArray(raw)) return [...DEFAULT_DATE_OVERRIDES];
  const out: DateOverride[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const date = typeof (entry as DateOverride).date === "string" ? (entry as DateOverride).date.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const available = Boolean((entry as DateOverride).available);
    out.push({ date, available });
  }
  return out;
}

function normalizeDisabledSlotsByDate(raw: unknown): DisabledSlotsByDate {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_DISABLED_SLOTS_BY_DATE };
  const out: DisabledSlotsByDate = {};
  for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!Array.isArray(value)) continue;
    const slots = value
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
    out[date] = Array.from(new Set(slots));
  }
  return out;
}

function normalizeCapacityByDateTime(raw: unknown): SlotCapacityByDateTime {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CAPACITY_BY_DATE_TIME };
  const out: SlotCapacityByDateTime = {};
  for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!value || typeof value !== "object") continue;
    const perSlot: Record<string, number> = {};
    for (const [time, capRaw] of Object.entries(value as Record<string, unknown>)) {
      const timeKey = time.trim();
      const cap = Number(capRaw);
      if (!timeKey || !Number.isFinite(cap) || cap < 1) continue;
      perSlot[timeKey] = Math.floor(cap);
    }
    out[date] = perSlot;
  }
  return out;
}

function normalizeSlotCapacity(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SLOT_CAPACITY;
  const v = Math.floor(n);
  if (v < 1) return DEFAULT_SLOT_CAPACITY;
  return v;
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
      dateOverrides: normalizeDateOverrides(data?.dateOverrides),
      disabledSlotsByDate: normalizeDisabledSlotsByDate(data?.disabledSlotsByDate),
      slotCapacityByDateTime: normalizeCapacityByDateTime(data?.slotCapacityByDateTime),
    };
  } catch {
    return {
      rows: defaultWeeklyHours(),
      timeSlots: [...DEFAULT_TIME_SLOTS],
      blockedDates: [...DEFAULT_BLOCKED_DATES],
      slotCapacity: DEFAULT_SLOT_CAPACITY,
      dateOverrides: [...DEFAULT_DATE_OVERRIDES],
      disabledSlotsByDate: { ...DEFAULT_DISABLED_SLOTS_BY_DATE },
      slotCapacityByDateTime: { ...DEFAULT_CAPACITY_BY_DATE_TIME },
    };
  }
}

export function defaultClinicSchedule(): ClinicScheduleData {
  return {
    rows: defaultWeeklyHours(),
    timeSlots: [...DEFAULT_TIME_SLOTS],
    blockedDates: [...DEFAULT_BLOCKED_DATES],
    slotCapacity: DEFAULT_SLOT_CAPACITY,
    dateOverrides: [...DEFAULT_DATE_OVERRIDES],
    disabledSlotsByDate: { ...DEFAULT_DISABLED_SLOTS_BY_DATE },
    slotCapacityByDateTime: { ...DEFAULT_CAPACITY_BY_DATE_TIME },
  };
}

export async function getClinicScheduleFromDisk(): Promise<ClinicScheduleData> {
  const p = prisma as unknown as {
    clinicWeeklyHours?: {
      findMany: (args: unknown) => Promise<Array<{ orderIndex: number; label: string; hours: string }>>;
    };
    clinicAppointmentSchedule?: {
      findFirst: (args: unknown) => Promise<
        | {
            slotCapacity: number;
            timeSlots: Array<{ orderIndex: number; time: string }>;
            blockedDates: Array<{ date: string }>;
            dateOverrides: Array<{ date: string; available: boolean }>;
            disabledSlots: Array<{ date: string; time: string }>;
            slotCapacityByDateTime: Array<{ date: string; time: string; capacity: number }>;
          }
        | null
      >;
    };
  };
  try {
    if (!p.clinicWeeklyHours || !p.clinicAppointmentSchedule) {
      throw new Error("Prisma schedule delegates not available.");
    }
    const [weeklyRows, scheduleRules] = await Promise.all([
      p.clinicWeeklyHours.findMany({
        orderBy: { orderIndex: "asc" },
      }),
      p.clinicAppointmentSchedule.findFirst({
        where: { id: 1 },
        include: {
          timeSlots: { orderBy: { orderIndex: "asc" } },
          blockedDates: true,
          dateOverrides: true,
          disabledSlots: true,
          slotCapacityByDateTime: true,
        },
      }),
    ]);
    if (weeklyRows.length > 0 || scheduleRules) {
      const rows = weeklyRows
        .map((entry) => ({ label: entry.label.trim(), hours: entry.hours.trim() }))
        .filter((entry) => entry.label && entry.hours);
      if (!scheduleRules) {
        return {
          rows: rows.length > 0 ? rows : defaultWeeklyHours(),
          timeSlots: [...DEFAULT_TIME_SLOTS],
          blockedDates: [...DEFAULT_BLOCKED_DATES],
          slotCapacity: DEFAULT_SLOT_CAPACITY,
          dateOverrides: [...DEFAULT_DATE_OVERRIDES],
          disabledSlotsByDate: { ...DEFAULT_DISABLED_SLOTS_BY_DATE },
          slotCapacityByDateTime: { ...DEFAULT_CAPACITY_BY_DATE_TIME },
        };
      }
      const disabledSlotsByDate: DisabledSlotsByDate = {};
      for (const entry of scheduleRules.disabledSlots) {
        if (!disabledSlotsByDate[entry.date]) {
          disabledSlotsByDate[entry.date] = [];
        }
        disabledSlotsByDate[entry.date]!.push(entry.time);
      }
      const slotCapacityByDateTime: SlotCapacityByDateTime = {};
      for (const entry of scheduleRules.slotCapacityByDateTime) {
        if (!slotCapacityByDateTime[entry.date]) {
          slotCapacityByDateTime[entry.date] = {};
        }
        slotCapacityByDateTime[entry.date]![entry.time] = entry.capacity;
      }
      return {
        rows: rows.length > 0 ? rows : defaultWeeklyHours(),
        timeSlots:
          scheduleRules.timeSlots.length > 0
            ? scheduleRules.timeSlots.map((x) => x.time)
            : [...DEFAULT_TIME_SLOTS],
        blockedDates: scheduleRules.blockedDates.map((x) => x.date),
        slotCapacity: scheduleRules.slotCapacity,
        dateOverrides: scheduleRules.dateOverrides.map((x) => ({
          date: x.date,
          available: x.available,
        })),
        disabledSlotsByDate,
        slotCapacityByDateTime,
      };
    }
  } catch {
    // fall back to disk copy if relational tables are unavailable
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
  const p = prisma as unknown as {
    $transaction?: (fn: (tx: unknown) => Promise<void>) => Promise<void>;
  };
  try {
    if (!p.$transaction) {
      throw new Error("Prisma transaction API unavailable.");
    }
    await p.$transaction(async (txUnknown) => {
      const tx = txUnknown as {
        clinicWeeklyHours: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentSchedule: {
          upsert: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentTimeSlot: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentBlockedDate: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentDateOverride: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentDisabledSlot: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
        clinicAppointmentSlotCapacityOverride: {
          deleteMany: (args: unknown) => Promise<unknown>;
          createMany: (args: unknown) => Promise<unknown>;
        };
      };
      await tx.clinicWeeklyHours.deleteMany({});
      await tx.clinicWeeklyHours.createMany({
        data: data.rows.map((row, index) => ({
          orderIndex: index,
          label: row.label,
          hours: row.hours,
        })),
      });

      await tx.clinicAppointmentSchedule.upsert({
        where: { id: 1 },
        create: { id: 1, slotCapacity: data.slotCapacity },
        update: { slotCapacity: data.slotCapacity },
      });

      await tx.clinicAppointmentTimeSlot.deleteMany({ where: { scheduleId: 1 } });
      if (data.timeSlots.length > 0) {
        await tx.clinicAppointmentTimeSlot.createMany({
          data: data.timeSlots.map((time, orderIndex) => ({
            scheduleId: 1,
            orderIndex,
            time,
          })),
        });
      }

      await tx.clinicAppointmentBlockedDate.deleteMany({ where: { scheduleId: 1 } });
      if (data.blockedDates.length > 0) {
        await tx.clinicAppointmentBlockedDate.createMany({
          data: data.blockedDates.map((date) => ({ scheduleId: 1, date })),
        });
      }

      await tx.clinicAppointmentDateOverride.deleteMany({ where: { scheduleId: 1 } });
      if (data.dateOverrides.length > 0) {
        await tx.clinicAppointmentDateOverride.createMany({
          data: data.dateOverrides.map((entry) => ({
            scheduleId: 1,
            date: entry.date,
            available: entry.available,
          })),
        });
      }

      await tx.clinicAppointmentDisabledSlot.deleteMany({ where: { scheduleId: 1 } });
      const disabledSlotsData: Array<{ scheduleId: number; date: string; time: string }> = [];
      for (const [date, slots] of Object.entries(data.disabledSlotsByDate)) {
        for (const time of slots) {
          disabledSlotsData.push({ scheduleId: 1, date, time });
        }
      }
      if (disabledSlotsData.length > 0) {
        await tx.clinicAppointmentDisabledSlot.createMany({ data: disabledSlotsData });
      }

      await tx.clinicAppointmentSlotCapacityOverride.deleteMany({ where: { scheduleId: 1 } });
      const perSlotCapData: Array<{ scheduleId: number; date: string; time: string; capacity: number }> =
        [];
      for (const [date, perSlot] of Object.entries(data.slotCapacityByDateTime)) {
        for (const [time, capacity] of Object.entries(perSlot)) {
          perSlotCapData.push({ scheduleId: 1, date, time, capacity });
        }
      }
      if (perSlotCapData.length > 0) {
        await tx.clinicAppointmentSlotCapacityOverride.createMany({ data: perSlotCapData });
      }
    });
  } catch {
    // fall back to disk copy when DB relation writes fail
  }
  const ok = await runCppScheduleSave(body);
  if (!ok) {
    try {
      mkdirSync(dirname(CLINIC_WEEKLY_HOURS_PATH), { recursive: true });
      writeFileSync(CLINIC_WEEKLY_HOURS_PATH, body, "utf8");
    } catch {
      // Read-only filesystem (e.g. Vercel) — DB write above is the primary store.
    }
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
  if (!isDateAvailable(d, schedule)) {
    return { ok: false, message: "That date is unavailable (blocked by the clinic)." };
  }
  if (isSlotDisabledForDate(d, t, schedule)) {
    return { ok: false, message: "That time slot is disabled for this date." };
  }
  if (!schedule.timeSlots.includes(t)) {
    return { ok: false, message: "That time is not an available slot." };
  }
  return { ok: true };
}

export function isDateAvailable(dateIso: string, schedule: ClinicScheduleData): boolean {
  return isDateAvailableForSchedule(dateIso, schedule);
}

export function isSlotDisabledForDate(
  dateIso: string,
  preferredTime: string,
  schedule: ClinicScheduleData
): boolean {
  const disabled = schedule.disabledSlotsByDate[dateIso] ?? [];
  return disabled.includes(preferredTime);
}

export function getSlotCapacityForDateTime(
  schedule: ClinicScheduleData,
  dateIso: string,
  preferredTime: string
): number {
  const perDate = schedule.slotCapacityByDateTime[dateIso];
  if (perDate && Number.isFinite(perDate[preferredTime]) && perDate[preferredTime]! > 0) {
    return Math.floor(perDate[preferredTime]!);
  }
  return schedule.slotCapacity;
}
