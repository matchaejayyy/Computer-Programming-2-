import { NextResponse } from "next/server";

import { appointmentToHistoryEntry } from "@/lib/repositories/appointment/appointment-history-mapper";
import { getStudentProfile } from "@/lib/repositories/student/profile-store";
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
    const email = profile.email.trim().toLowerCase();
    const rows = await prisma.appointment.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        adminNote: true,
        submittedAt: true,
        preferredDate: true,
        preferredTime: true,
        studentName: true,
        reason: true,
        otherReasonDetail: true,
      },
    });
    return NextResponse.json({
      history: rows.map((r) =>
        appointmentToHistoryEntry(r as Parameters<typeof appointmentToHistoryEntry>[0])
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load history." },
      { status: 500 }
    );
  }
}
