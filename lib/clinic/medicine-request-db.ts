import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { prisma } from "@/lib/prisma";
import { MEDICINE_REQUESTS_DB_PATH } from "@/lib/clinic/clinic-paths";

export { MEDICINE_REQUESTS_DB_PATH };

export async function syncMedicineRequestsNativeFileFromDb(): Promise<void> {
  const rows = await prisma.medicineRequest.findMany({ orderBy: { id: "asc" } });
  mkdirSync(dirname(MEDICINE_REQUESTS_DB_PATH), { recursive: true });
  const lines =
    rows
      .map((r) => {
        const rec: Record<string, string | number> = {
          id: r.id,
          studentId: r.studentId,
          name: r.name,
          medication: r.medication,
          quantity: r.quantity,
          requestedAt: r.requestedAt.toISOString(),
          createdAt: r.createdAt.toISOString(),
        };
        return JSON.stringify(rec);
      })
      .join("\n") + (rows.length ? "\n" : "");
  writeFileSync(MEDICINE_REQUESTS_DB_PATH, lines, "utf8");
}

export async function createMedicineRequestInDb(input: {
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: Date;
}): Promise<{ id: number; studentId: string; name: string; medication: string; quantity: number; requestedAt: Date }> {
  const row = await prisma.medicineRequest.create({
    data: {
      studentId: input.studentId,
      name: input.name,
      medication: input.medication,
      quantity: input.quantity,
      requestedAt: input.requestedAt,
    },
  });
  await syncMedicineRequestsNativeFileFromDb();
  return row;
}

export async function updateMedicineRequestInDb(
  id: number,
  input: {
    studentId: string;
    name: string;
    medication: string;
    quantity: number;
    requestedAt?: Date;
  },
): Promise<{ id: number; studentId: string; name: string; medication: string; quantity: number; requestedAt: Date }> {
  const row = await prisma.medicineRequest.update({
    where: { id },
    data: {
      studentId: input.studentId,
      name: input.name,
      medication: input.medication,
      quantity: input.quantity,
      ...(input.requestedAt ? { requestedAt: input.requestedAt } : {}),
    },
  });
  await syncMedicineRequestsNativeFileFromDb();
  return row;
}

export async function deleteMedicineRequestInDb(id: number): Promise<void> {
  await prisma.medicineRequest.delete({ where: { id } });
  await syncMedicineRequestsNativeFileFromDb();
}
