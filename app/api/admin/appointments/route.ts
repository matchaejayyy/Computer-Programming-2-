import { NextResponse } from "next/server";

import {
  listStoredAppointmentsWithSearch,
  toAppointmentRequestView,
  updateAppointmentRecord,
  type AppointmentListFilter,
} from "@/lib/repositories/appointment/appointment-records";
import { isRequestStatus } from "@/lib/utils/constants/mock-requests";

function parseFilter(raw: string | null): AppointmentListFilter {
  if (
    raw === "pending" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "cancelled" ||
    raw === "no_show" ||
    raw === "completed" ||
    raw === "all"
  ) {
    return raw;
  }
  return "all";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = parseFilter(searchParams.get("filter"));
  const q = searchParams.get("q")?.trim() ?? "";
  const dateRaw = searchParams.get("date")?.trim() ?? "";
  const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : undefined;
  try {
    const items = (await listStoredAppointmentsWithSearch(filter, q, dateIso)).map(
      toAppointmentRequestView
    );
    return NextResponse.json({ appointments: items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load appointments." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const updateId = typeof o.updateId === "number" ? o.updateId : Number(o.updateId);
  const statusRaw = o.status;
  const adminNote =
    typeof o.adminNote === "string" ? o.adminNote.trim() : "";

  if (!Number.isFinite(updateId) || updateId < 1) {
    return NextResponse.json({ error: "Invalid updateId" }, { status: 400 });
  }

  if (typeof statusRaw !== "string" || !isRequestStatus(statusRaw)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await updateAppointmentRecord(updateId, statusRaw, adminNote);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 500 }
    );
  }
}
