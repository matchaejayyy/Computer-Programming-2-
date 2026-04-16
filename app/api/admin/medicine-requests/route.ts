import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createMedicineRequestInDb,
  syncMedicineRequestsNativeFileFromDb,
} from "@/lib/repositories/medicine/medicine-request-db";
import {
  listMedicineRequestsCpp,
  saveMedicineRequestCpp,
} from "@/lib/repositories/medicine/medicine-request-records";

function formatDateTime(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

function isoToDisplay(iso: string): string {
  const datePart = iso.substring(0, 10);
  const timePart = iso.substring(11, 16);
  return `${datePart} ${timePart}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const search = searchParams.get("search");

  try {
    const cppResult = await listMedicineRequestsCpp(date || undefined, search || undefined);
    if (cppResult !== null) {
      const formatted = cppResult.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        name: r.name,
        medication: r.medication,
        quantity: r.quantity,
        requestedAt: r.requestedAt.includes("T")
          ? isoToDisplay(r.requestedAt)
          : r.requestedAt,
      }));
      return NextResponse.json(formatted);
    }

    const where: Record<string, unknown> = {};

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.requestedAt = { gte: dayStart, lte: dayEnd };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { medication: { contains: search, mode: "insensitive" } },
      ];
    }

    const requests = await prisma.medicineRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.name,
      medication: r.medication,
      quantity: r.quantity,
      requestedAt: formatDateTime(r.requestedAt),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/admin/medicine-requests error:", err);
    return NextResponse.json(
      { error: "Failed to fetch medicine requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, name, medication, quantity, date, time } = body;

    if (!studentId || !name || !medication || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "studentId, name, medication, and quantity (>=1) are required" },
        { status: 400 },
      );
    }

    const requestedAt =
      date && time
        ? new Date(`${date}T${time}:00.000Z`)
        : new Date();

    const cppId = await saveMedicineRequestCpp({
      studentId,
      name,
      medication,
      quantity: Number(quantity),
      requestedAt: requestedAt.toISOString(),
    });

    if (cppId !== null) {
      const created = await createMedicineRequestInDb({
        studentId,
        name,
        medication,
        quantity: Number(quantity),
        requestedAt,
      });

      await syncMedicineRequestsNativeFileFromDb();

      return NextResponse.json(
        {
          id: created.id,
          studentId: created.studentId,
          name: created.name,
          medication: created.medication,
          quantity: created.quantity,
          requestedAt: formatDateTime(created.requestedAt),
        },
        { status: 201 },
      );
    }

    const created = await createMedicineRequestInDb({
      studentId,
      name,
      medication,
      quantity: Number(quantity),
      requestedAt,
    });

    return NextResponse.json(
      {
        id: created.id,
        studentId: created.studentId,
        name: created.name,
        medication: created.medication,
        quantity: created.quantity,
        requestedAt: formatDateTime(created.requestedAt),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/admin/medicine-requests error:", err);
    return NextResponse.json(
      { error: "Failed to create medicine request" },
      { status: 500 },
    );
  }
}
