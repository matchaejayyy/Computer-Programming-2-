import { NextResponse } from "next/server";

import { getStudentProfile } from "@/lib/repositories/student/profile-store";
import { prisma } from "@/lib/prisma";

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
    const rows = await prisma.appointment.groupBy({
      by: ["status"],
      where: { email: { equals: email, mode: "insensitive" } },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = row._count.status;
    }

    return NextResponse.json({
      pending: counts.pending ?? 0,
      approved: counts.approved ?? 0,
      rejected: counts.rejected ?? 0,
      cancelled: counts.cancelled ?? 0,
      no_show: counts.no_show ?? 0,
      completed: counts.completed ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load stats." },
      { status: 500 }
    );
  }
}
