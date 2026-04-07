import { NextResponse } from "next/server";

import { appointmentToHistoryEntry } from "@/lib/clinic/appointment-history-mapper";
import { getStudentProfile } from "@/lib/clinic/profile-store";
import { prisma } from "@/lib/prisma";

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
    const rows = await prisma.appointment.findMany({
      where: { email: { equals: profile.email, mode: "insensitive" } },
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({
      history: rows.map(appointmentToHistoryEntry),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load history." },
      { status: 500 }
    );
  }
}
