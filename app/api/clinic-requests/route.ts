import { NextResponse } from "next/server";

import {
  readAllStoredAppointments,
  toAppointmentRequestView,
} from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
  }

  try {
    const profile = getStudentProfile(studentId);
    const email = profile.email.trim().toLowerCase();
    const appointments = readAllStoredAppointments()
      .filter(
        ({ record }) => record.email.trim().toLowerCase() === email
      )
      .map((item) => {
        const v = toAppointmentRequestView(item);
        return {
          id: v.id,
          status: v.status,
          submittedAt: v.submittedAt,
          requestedDate: v.requestedDate,
          reason: v.reason,
          studentName: v.studentName,
          email: v.email,
          address: v.address,
          clinicNote: v.clinicNote,
          schoolIdNumber: v.schoolIdNumber,
        };
      });

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load requests." },
      { status: 500 }
    );
  }
}
