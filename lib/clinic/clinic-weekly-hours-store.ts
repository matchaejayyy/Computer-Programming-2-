import { existsSync, readFileSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import { join } from "path";

import { WEEKLY_CLINIC_HOURS } from "@/lib/clinic/clinic-schedule";

export const CLINIC_WEEKLY_HOURS_PATH = join(
  process.cwd(),
  "native",
  "appointments",
  "clinic_weekly_hours.json"
);

export type WeeklyHourRow = { label: string; hours: string };

export type WeeklyHoursFile = { rows: WeeklyHourRow[] };

function defaultWeeklyHours(): WeeklyHourRow[] {
  return WEEKLY_CLINIC_HOURS.map((r) => ({ label: r.label, hours: r.hours }));
}

function parseWeeklyFile(content: string): WeeklyHourRow[] {
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

export function getWeeklyClinicHoursFromDisk(): WeeklyHourRow[] {
  if (!existsSync(CLINIC_WEEKLY_HOURS_PATH)) {
    return defaultWeeklyHours();
  }
  try {
    const raw = readFileSync(CLINIC_WEEKLY_HOURS_PATH, "utf8");
    const rows = parseWeeklyFile(raw);
    return rows.length > 0 ? rows : defaultWeeklyHours();
  } catch {
    return defaultWeeklyHours();
  }
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

export async function saveWeeklyClinicHours(rows: WeeklyHourRow[]): Promise<void> {
  const body = JSON.stringify({ rows }, null, 2) + "\n";
  const ok = await runCppScheduleSave(body);
  if (!ok) {
    writeFileSync(CLINIC_WEEKLY_HOURS_PATH, body, "utf8");
  }
}
