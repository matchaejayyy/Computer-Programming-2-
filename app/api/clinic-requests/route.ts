import { NextResponse } from "next/server";

import { getStudentProfile } from "@/lib/clinic/profile-store";
import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/lib/clinic/mock-requests";

const requestStatusPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
  no_show: 4,
  completed: 5,
} as const;

function formatReason(reason: string, otherDetail: string): string {
  return reason === "others" && otherDetail.trim()
    ? `Others — ${otherDetail.trim()}`
    : reason;
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

    const rows = await prisma.appointment.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        preferredDate: true,
        preferredTime: true,
        reason: true,
        otherReasonDetail: true,
        studentName: true,
        email: true,
        address: true,
        adminNote: true,
        schoolIdNumber: true,
      },
    });

    const appointments = rows
      .map((r) => ({
        id: `REQ-${String(r.id).padStart(4, "0")}`,
        updateId: r.id,
        status: r.status as RequestStatus,
        submittedAt: r.submittedAt.toISOString(),
        requestedDate: `${r.preferredDate} — ${r.preferredTime}`,
        reason: formatReason(r.reason, r.otherReasonDetail),
        studentName: r.studentName,
        email: r.email,
        address: r.address,
        clinicNote: r.adminNote?.trim() ? r.adminNote : undefined,
        schoolIdNumber: r.schoolIdNumber?.trim() || undefined,
      }))
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
