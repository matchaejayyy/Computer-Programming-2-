import { NextResponse } from "next/server";

import {
  readAllStoredAppointments,
  toAppointmentRequestView,
} from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";

const requestStatusPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
  no_show: 4,
} as const;

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
    const appointments = (await readAllStoredAppointments())
      .filter(
        ({ record }) => record.email.trim().toLowerCase() === email
      )
      .map((item) => {
        const v = toAppointmentRequestView(item);
        return {
          id: v.id,
          updateId: v.updateId,
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
      })
      .sort((a, b) => {
        const byStatus =
          requestStatusPriority[a.status] - requestStatusPriority[b.status];
        if (byStatus !== 0) return byStatus;
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      });

    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load requests." },
      { status: 500 }
    );
  }
}
