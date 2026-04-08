import { NextResponse } from "next/server";

import {
  updateMedicineRequestInDb,
  deleteMedicineRequestInDb,
} from "@/lib/clinic/medicine-request-db";
import {
  updateMedicineRequestCpp,
  deleteMedicineRequestCpp,
} from "@/lib/clinic/medicine-request-records";

function formatDateTime(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const min = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

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
        : undefined;

    const requestedAtIso =
      date && time ? `${date}T${time}:00.000Z` : undefined;

    await updateMedicineRequestCpp(numId, {
      studentId,
      name,
      medication,
      quantity: Number(quantity),
      requestedAt: requestedAtIso,
    });

    const updated = await updateMedicineRequestInDb(numId, {
      studentId,
      name,
      medication,
      quantity: Number(quantity),
      ...(requestedAt ? { requestedAt } : {}),
    });

    return NextResponse.json({
      id: updated.id,
      studentId: updated.studentId,
      name: updated.name,
      medication: updated.medication,
      quantity: updated.quantity,
      requestedAt: formatDateTime(updated.requestedAt),
    });
  } catch (err) {
    console.error("PUT /api/admin/medicine-requests/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update medicine request" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await deleteMedicineRequestCpp(numId);

    await deleteMedicineRequestInDb(numId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/medicine-requests/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete medicine request" },
      { status: 500 },
    );
  }
}
