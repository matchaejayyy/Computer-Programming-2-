import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { countMedicineByMedicationCpp } from "@/lib/clinic/medicine-request-records";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  try {
    const totalPatients = await prisma.user.count({ where: { role: "STUDENT" } });

    let dayStart: Date | null = null;
    let dayEnd: Date | null = null;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      dayStart = new Date(`${dateParam}T00:00:00.000Z`);
      dayEnd = new Date(`${dateParam}T23:59:59.999Z`);
    }

    const todayAppointments =
      dayStart && dayEnd
        ? await prisma.appointment.count({
            where: {
              submittedAt: { gte: dayStart, lte: dayEnd },
            },
          })
        : await prisma.appointment.count();

    const completed = await prisma.appointment.count({ where: { status: "approved" } });
    const cancelled = await prisma.appointment.count({ where: { status: "cancelled" } });
    const noShow = await prisma.appointment.count({ where: { status: "no_show" } });

    const cppCounts = await countMedicineByMedicationCpp();
    let medicineStats: Record<string, number>;

    if (cppCounts !== null) {
      medicineStats = cppCounts.medications;
    } else {
      const medicineAgg = await prisma.medicineRequest.groupBy({
        by: ["medication"],
        _count: { medication: true },
        orderBy: { _count: { medication: "desc" } },
      });
      medicineStats = {};
      for (const row of medicineAgg) {
        medicineStats[row.medication] = row._count.medication;
      }
    }

    const stats = {
      totalPatients,
      todayAppointments,
      completed,
      cancelled,
      noShow,
      medicineStats,
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ message: "Visit logged.", received: body }, { status: 201 });
}
