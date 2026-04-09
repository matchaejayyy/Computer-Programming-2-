import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { countAppointmentsForSlot, hasStudentBookedSameSlot } from "@/lib/clinic/appointment-db";
import {
  getSlotCapacityForDateTime,
  getClinicScheduleFromDisk,
  validatePreferredSlot,
} from "@/lib/clinic/clinic-weekly-hours-store";
import { getStudentProfile } from "@/lib/clinic/profile-store";
import { isProfileFieldUnset } from "@/lib/clinic/profile-placeholders";
import { reserveAppointmentCpp, type ReserveAppointmentPayload } from "@/lib/clinic/cpp-reserve";

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
  const profileLookup = session.user.studentId ?? session.user.email;
  const student = await getStudentProfile(profileLookup);
  if (!student) {
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
  }
  if (
    isProfileFieldUnset(student.address) ||
    isProfileFieldUnset(student.schoolIdNumber)
  ) {
    return NextResponse.json(
      {
        error:
          "Complete your profile first (school ID number and address) before reserving an appointment.",
      },
      { status: 400 }
    );
  }

  payload.studentName = student.name;
  payload.email = student.email;
  payload.schoolIdNumber = student.schoolIdNumber;
  payload.address = student.address;

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

  const rawSchoolId = (payload as Record<string, unknown>).schoolIdNumber;
  if (rawSchoolId !== undefined && rawSchoolId !== null) {
    if (typeof rawSchoolId !== "string") {
      return NextResponse.json({ error: "Invalid field: schoolIdNumber" }, { status: 400 });
    }
    payload.schoolIdNumber = rawSchoolId.trim() || undefined;
  }

  try {
    const [schedule, duplicate, booked] = await Promise.all([
      getClinicScheduleFromDisk(),
      hasStudentBookedSameSlot({
        email: payload.email,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
      }),
      countAppointmentsForSlot(payload.preferredDate, payload.preferredTime),
    ]);

    const slotOk = validatePreferredSlot(
      payload.preferredDate,
      payload.preferredTime,
      schedule
    );
    if (!slotOk.ok) {
      return NextResponse.json({ error: slotOk.message }, { status: 400 });
    }
    if (duplicate) {
      return NextResponse.json(
        { error: "You already have a pending/approved booking for this date and time." },
        { status: 400 }
      );
    }
    const slotCapacity = getSlotCapacityForDateTime(
      schedule,
      payload.preferredDate,
      payload.preferredTime
    );
    if (booked >= slotCapacity) {
      return NextResponse.json(
        { error: "Selected time slot is full. Please choose another time." },
        { status: 400 }
      );
    }
    const message = await reserveAppointmentCpp(payload);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save appointment." },
      { status: 500 }
    );
  }
}
