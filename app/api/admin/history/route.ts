import { NextResponse } from "next/server";

import { appointmentToHistoryEntry } from "@/lib/clinic/appointment-history-mapper";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.appointment.findMany({
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
      history: rows.map((r) => appointmentToHistoryEntry(r as Parameters<typeof appointmentToHistoryEntry>[0])),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load history." },
      { status: 500 }
    );
  }
}
