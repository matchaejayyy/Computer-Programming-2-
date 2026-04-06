import { NextResponse } from "next/server";

import { appointmentToHistoryEntry } from "@/lib/clinic/appointment-history-mapper";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.appointment.findMany({
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
