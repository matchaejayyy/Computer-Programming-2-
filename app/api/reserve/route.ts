import { NextResponse } from "next/server";

import { reserveAppointmentCpp, type ReserveAppointmentPayload } from "@/lib/clinic/cpp-reserve";

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const payload = body as ReserveAppointmentPayload;
  const requiredFields: Array<keyof ReserveAppointmentPayload> = [
    "studentName",
    "email",
    "address",
    "reason",
    "preferredDate",
    "preferredTime",
  ];

  for (const field of requiredFields) {
    const rawValue = (payload as Record<string, unknown>)[field];
    if (!isString(rawValue)) {
      return NextResponse.json({ error: `Missing or invalid field: ${field}` }, { status: 400 });
    }
    (payload as Record<string, unknown>)[field] = rawValue.trim();
  }

  if (payload.reason === "others" && !isString(payload.otherReasonDetail)) {
    return NextResponse.json(
      { error: "When reason is 'Others', please specify the appointment reason." },
      { status: 400 }
    );
  }

  try {
    const message = await reserveAppointmentCpp(payload);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save appointment." },
      { status: 500 }
    );
  }
}
