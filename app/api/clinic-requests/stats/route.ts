import { NextResponse } from "next/server";

import { readAllStoredAppointments } from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";

function statusOf(
  record: { status?: string }
): "pending" | "approved" | "rejected" | "cancelled" | "no_show" | "completed" {
  if (
    record.status === "approved" ||
    record.status === "rejected" ||
    record.status === "cancelled" ||
    record.status === "no_show" ||
    record.status === "completed"
  ) {
    return record.status;
  }
  return "pending";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  try {
    const profile = await getStudentProfile(studentId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const email = profile.email.trim().toLowerCase();
    const rows = (await readAllStoredAppointments()).filter(
      ({ record }) => record.email.trim().toLowerCase() === email
    );

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;
    let no_show = 0;
    let completed = 0;
    for (const { record } of rows) {
      const s = statusOf(record);
      if (s === "pending") {
        pending += 1;
      } else if (s === "approved") {
        approved += 1;
      } else if (s === "rejected") {
        rejected += 1;
      } else if (s === "cancelled") {
        cancelled += 1;
      } else if (s === "no_show") {
        no_show += 1;
      } else {
        completed += 1;
      }
    }

    return NextResponse.json({ pending, approved, rejected, cancelled, no_show, completed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load stats." },
      { status: 500 }
    );
  }
}
