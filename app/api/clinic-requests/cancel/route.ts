import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { syncAppointmentsNativeFileFromDb } from "@/lib/clinic/appointment-db";
import { prisma } from "@/lib/prisma";

const CANCEL_REASONS = new Set([
  "schedule_conflict",
  "already_resolved",
  "not_available",
  "others",
]);

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const updateId = Number(raw.updateId);
  const reason = String(raw.reason ?? "").trim();
  const otherNote = String(raw.otherNote ?? "").trim();

  if (!Number.isFinite(updateId) || updateId < 1) {
    return NextResponse.json({ error: "Invalid appointment id." }, { status: 400 });
  }
  if (!CANCEL_REASONS.has(reason)) {
    return NextResponse.json({ error: "Please select a cancellation reason." }, { status: 400 });
  }
  if (reason === "others" && !otherNote) {
    return NextResponse.json(
      { error: "Please provide your note when reason is Others." },
      { status: 400 }
    );
  }

  const email = session.user.email.trim().toLowerCase();
  const appointment = await prisma.appointment.findFirst({
    where: { id: updateId, email: { equals: email, mode: "insensitive" } },
    select: { id: true, status: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }
  if (appointment.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending appointments can be cancelled." },
      { status: 400 }
    );
  }

  const reasonLabel =
    reason === "schedule_conflict"
      ? "Schedule conflict"
      : reason === "already_resolved"
        ? "Concern already resolved"
        : reason === "not_available"
          ? "Not available"
          : "Others";
  const note = reason === "others" ? `Cancelled by student: ${otherNote}` : `Cancelled by student: ${reasonLabel}`;

  await prisma.$executeRaw(
    Prisma.sql`UPDATE "Appointment"
      SET "status" = CAST(${ "cancelled"} AS "AppointmentStatus"),
          "adminNote" = ${note},
          "reviewedAt" = ${new Date()}
      WHERE "id" = ${updateId}`
  );
  await syncAppointmentsNativeFileFromDb();

  return NextResponse.json({ success: true, message: "Appointment cancelled." });
}
