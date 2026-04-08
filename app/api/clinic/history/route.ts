import { NextResponse } from "next/server";

import { storedAppointmentToHistoryEntry } from "@/lib/clinic/appointment-history-mapper";
import { readAllStoredAppointments } from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  try {
    const profile = await getStudentProfile(studentId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }
    const email = profile.email.trim().toLowerCase();
    const all = await readAllStoredAppointments();
    const rows = all
      .filter(({ record }) => record.email.trim().toLowerCase() === email)
      .sort((a, b) => {
        const ta = new Date(a.record.submittedAt ?? 0).getTime();
        const tb = new Date(b.record.submittedAt ?? 0).getTime();
        return tb - ta;
      });
    return NextResponse.json({
      history: rows.map(storedAppointmentToHistoryEntry),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load history." },
      { status: 500 }
    );
  }
}
