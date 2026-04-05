import { NextResponse } from "next/server";

import { readAllStoredAppointments } from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";

function statusOf(record: { status?: string }): "pending" | "approved" | "rejected" {
  if (record.status === "approved" || record.status === "rejected") {
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
    const profile = getStudentProfile(studentId);
    const email = profile.email.trim().toLowerCase();
    const rows = readAllStoredAppointments().filter(
      ({ record }) => record.email.trim().toLowerCase() === email
    );

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const { record } of rows) {
      const s = statusOf(record);
      if (s === "pending") {
        pending += 1;
      } else if (s === "approved") {
        approved += 1;
      } else {
        rejected += 1;
      }
    }

    return NextResponse.json({ pending, approved, rejected });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load stats." },
      { status: 500 }
    );
  }
}
