import { NextResponse } from "next/server";

import { countAppointmentsByDateAndTime } from "@/lib/clinic/appointment-db";
import { getClinicScheduleFromDisk } from "@/lib/clinic/clinic-weekly-hours-store";
import { countAppointmentsByDateAndTimeCpp } from "@/lib/clinic/cpp-count-by-date-time";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date")?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)." }, { status: 400 });
  }

  const schedule = await getClinicScheduleFromDisk();
  const blocked = schedule.blockedDates.includes(date);
  const counts =
    (await countAppointmentsByDateAndTimeCpp(date)) ?? (await countAppointmentsByDateAndTime(date));
  const slotCapacity = schedule.slotCapacity;
  const slots = schedule.timeSlots.map((time) => {
    const booked = counts[time] ?? 0;
    const full = booked >= slotCapacity;
    return { time, booked, capacity: slotCapacity, full };
  });
  const allFull = slots.length > 0 && slots.every((slot) => slot.full);

  return NextResponse.json({
    date,
    blocked,
    allFull,
    slotCapacity,
    slots,
  });
}
