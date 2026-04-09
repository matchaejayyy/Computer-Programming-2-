import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  try {
    let dayStart: Date | null = null;
    let dayEnd: Date | null = null;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dayStart = new Date(`${dateParam}T00:00:00.000Z`);
      dayEnd = new Date(`${dateParam}T23:59:59.999Z`);
    }

    const [totalPatients, todayAppointments, statusCounts, medicineAgg] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      dayStart && dayEnd
        ? prisma.appointment.count({
            where: { submittedAt: { gte: dayStart, lte: dayEnd } },
          })
        : prisma.appointment.count(),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.medicineRequest.groupBy({
        by: ["medication"],
        _count: { medication: true },
        orderBy: { _count: { medication: "desc" } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row._count.status;
    }

    const medicineStats: Record<string, number> = {};
    for (const row of medicineAgg) {
      medicineStats[row.medication] = row._count.medication;
    }

    return NextResponse.json({
      totalPatients,
      todayAppointments,
      completed: statusMap.approved ?? 0,
      cancelled: statusMap.cancelled ?? 0,
      noShow: statusMap.no_show ?? 0,
      medicineStats,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ message: "Visit logged.", received: body }, { status: 201 });
}
