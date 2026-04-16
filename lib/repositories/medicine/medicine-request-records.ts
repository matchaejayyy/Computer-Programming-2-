import { existsSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

import { MEDICINE_REQUESTS_DB_PATH } from "@/lib/repositories/schedule/clinic-paths";
import { syncMedicineRequestsNativeFileFromDb } from "@/lib/repositories/medicine/medicine-request-db";

export type MedicineRequestRecord = {
  id: number;
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: string;
  createdAt?: string;
};

function binaryPath(name: string): string {
  const bin = process.platform === "win32" ? `${name}.exe` : name;
  return join(process.cwd(), "native", "medicine", bin);
}

/**
 * Lists medicine requests via C++ list_medicine_requests binary.
 * Falls back to null if binary missing (caller should use Prisma).
 */
export async function listMedicineRequestsCpp(
  dateFilter?: string,
  searchQuery?: string,
): Promise<MedicineRequestRecord[] | null> {
  await syncMedicineRequestsNativeFileFromDb();

  const executable = binaryPath("list_medicine_requests");
  if (!existsSync(executable)) return null;

  const args = [MEDICINE_REQUESTS_DB_PATH, dateFilter || "all"];
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: searchQuery || "",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout?.trim()) return null;

  try {
    const data = JSON.parse(result.stdout.trim()) as { requests?: unknown };
    if (!Array.isArray(data.requests)) return null;
    return data.requests as MedicineRequestRecord[];
  } catch {
    return null;
  }
}

/**
 * Saves a medicine request via C++ save_medicine_request binary.
 * Returns the new id, or null if binary missing.
 */
export async function saveMedicineRequestCpp(input: {
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: string;
}): Promise<number | null> {
  await syncMedicineRequestsNativeFileFromDb();

  const executable = binaryPath("save_medicine_request");
  if (!existsSync(executable)) return null;

  const stdinData = [
    `studentId=${input.studentId}`,
    `name=${input.name}`,
    `medication=${input.medication}`,
    `quantity=${input.quantity}`,
    `requestedAt=${input.requestedAt}`,
  ].join("\n");

  const result = spawnSync(executable, [MEDICINE_REQUESTS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: stdinData,
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout?.trim()) return null;

  try {
    const data = JSON.parse(result.stdout.trim()) as { id?: number };
    return typeof data.id === "number" ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * Updates a medicine request via C++ update_medicine_request binary.
 */
export async function updateMedicineRequestCpp(
  id: number,
  input: {
    studentId: string;
    name: string;
    medication: string;
    quantity: number;
    requestedAt?: string;
  },
): Promise<boolean> {
  await syncMedicineRequestsNativeFileFromDb();

  const executable = binaryPath("update_medicine_request");
  if (!existsSync(executable)) return false;

  const lines = [`id=${id}`, `studentId=${input.studentId}`, `name=${input.name}`, `medication=${input.medication}`, `quantity=${input.quantity}`];
  if (input.requestedAt) lines.push(`requestedAt=${input.requestedAt}`);

  const result = spawnSync(executable, [MEDICINE_REQUESTS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: lines.join("\n"),
    maxBuffer: 1024 * 1024,
  });

  return !result.error && result.status === 0;
}

/**
 * Deletes a medicine request via C++ delete_medicine_request binary.
 */
export async function deleteMedicineRequestCpp(id: number): Promise<boolean> {
  await syncMedicineRequestsNativeFileFromDb();

  const executable = binaryPath("delete_medicine_request");
  if (!existsSync(executable)) return false;

  const result = spawnSync(executable, [MEDICINE_REQUESTS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: String(id),
    maxBuffer: 1024 * 1024,
  });

  return !result.error && result.status === 0;
}

/**
 * Counts medicine requests by medication via C++ count_by_medication binary.
 * Returns {total, medications} or null if binary missing.
 */
export async function countMedicineByMedicationCpp(): Promise<{
  total: number;
  medications: Record<string, number>;
} | null> {
  await syncMedicineRequestsNativeFileFromDb();

  const executable = binaryPath("count_by_medication");
  if (!existsSync(executable)) return null;

  const result = spawnSync(executable, [MEDICINE_REQUESTS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });

  if (result.error || result.status !== 0 || !result.stdout?.trim()) return null;

  try {
    const data = JSON.parse(result.stdout.trim()) as {
      total?: number;
      medications?: Record<string, number>;
    };
    if (typeof data.total === "number" && data.medications) {
      return { total: data.total, medications: data.medications };
    }
  } catch {
    /* fall through */
  }
  return null;
}
