import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Runs native/appointments/search_appointments (C++). Returns 1-based line indices
 * matching filter + search (trimmed stdin line). Null if the binary is missing or fails.
 */
export function searchAppointmentLineNumbersCpp(
  dbPath: string,
  filter: "all" | "pending" | "approved" | "rejected" | "cancelled" | "no_show",
  query: string
): number[] | null {
  const binary =
    process.platform === "win32" ? "search_appointments.exe" : "search_appointments";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const result = spawnSync(executable, [dbPath, filter], {
    cwd: process.cwd(),
    input: `${query}\n`,
    encoding: "utf-8",
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout.trim()) as { lineNumbers?: unknown };
    if (!Array.isArray(parsed.lineNumbers)) {
      return null;
    }
    const nums = parsed.lineNumbers.filter(
      (n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 1
    );
    return nums;
  } catch {
    return null;
  }
}
