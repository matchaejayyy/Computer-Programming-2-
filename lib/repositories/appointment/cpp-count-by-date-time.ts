import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

import { APPOINTMENTS_DB_PATH } from "@/lib/repositories/schedule/clinic-paths";
import { syncAppointmentsNativeFileFromDb } from "@/lib/repositories/appointment/appointment-db";

/**
 * Returns appointment counts by preferredTime for a given date via native C++ binary.
 * Returns null when native tool is unavailable/fails; callers should fallback to TS/DB.
 */
export async function countAppointmentsByDateAndTimeCpp(
  preferredDate: string
): Promise<Record<string, number> | null> {
  const binary =
    process.platform === "win32" ? "count_by_date_time.exe" : "count_by_date_time";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  await syncAppointmentsNativeFileFromDb();

  const result = spawnSync(executable, [APPOINTMENTS_DB_PATH, preferredDate], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout.trim()) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k !== "string") continue;
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) continue;
      const key = k.trim();
      if (!key) continue;
      out[key] = Math.floor(v);
    }
    return out;
  } catch {
    return null;
  }
}
