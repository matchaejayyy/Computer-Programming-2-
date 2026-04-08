import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { prisma } from "@/lib/prisma";
import type { AppointmentStatus } from "@prisma/client";

import { APPOINTMENTS_DB_PATH } from "@/lib/clinic/clinic-paths";

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ["pending", "approved"];

export async function syncAppointmentsNativeFileFromDb(): Promise<void> {
  const rows = await prisma.appointment.findMany({ orderBy: { id: "asc" } });
  mkdirSync(dirname(APPOINTMENTS_DB_PATH), { recursive: true });
  const lines =
    rows
      .map((r) => {
        const rec: Record<string, string | number> = {
          id: r.id,
          status: r.status,
          adminNote: r.adminNote,
          submittedAt: r.submittedAt.toISOString(),
          reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : "",
          studentName: r.studentName,
          email: r.email,
          address: r.address,
          reason: r.reason,
          otherReasonDetail: r.otherReasonDetail,
          preferredDate: r.preferredDate,
          preferredTime: r.preferredTime,
        };
        if (r.schoolIdNumber?.trim()) {
          rec.schoolIdNumber = r.schoolIdNumber.trim();
        }
        return JSON.stringify(rec);
      })
      .join("\n") + (rows.length ? "\n" : "");
  writeFileSync(APPOINTMENTS_DB_PATH, lines, "utf8");
}

export async function createAppointmentInDb(input: {
  studentName: string;
  email: string;
  address: string;
  reason: string;
  otherReasonDetail?: string;
  preferredDate: string;
  preferredTime: string;
  schoolIdNumber?: string;
}): Promise<{ id: number }> {
  const row = await prisma.appointment.create({
    data: {
      studentName: input.studentName,
      email: input.email,
      address: input.address,
      reason: input.reason,
      otherReasonDetail: input.otherReasonDetail?.trim() ?? "",
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      schoolIdNumber: input.schoolIdNumber?.trim() || null,
    },
  });
  await syncAppointmentsNativeFileFromDb();
  return { id: row.id };
}

export async function updateAppointmentInDb(
  updateId: number,
  status: AppointmentStatus,
  adminNote: string
): Promise<void> {
  const reviewedAt = new Date();
  const result = await prisma.appointment.updateMany({
    where: { id: updateId },
    data: {
      status,
      adminNote,
      reviewedAt,
    },
  });
  if (result.count === 0) {
    throw new Error("No appointment with that id.");
  }
  await syncAppointmentsNativeFileFromDb();
}

export async function countAppointmentsForSlot(
  preferredDate: string,
  preferredTime: string
): Promise<number> {
  return prisma.appointment.count({
    where: {
      preferredDate,
      preferredTime,
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
    },
  });
}

export async function hasStudentBookedSameSlot(input: {
  email: string;
  preferredDate: string;
  preferredTime: string;
}): Promise<boolean> {
  const count = await prisma.appointment.count({
    where: {
      email: input.email,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
    },
  });
  return count > 0;
}

export async function countAppointmentsByDateAndTime(
  preferredDate: string
): Promise<Record<string, number>> {
  const rows = await prisma.appointment.findMany({
    where: {
      preferredDate,
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
    },
    select: { preferredTime: true },
  });
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = row.preferredTime.trim();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}
