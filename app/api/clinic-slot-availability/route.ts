import { NextResponse } from "next/server";

import { countAppointmentsByDateAndTime } from "@/lib/clinic/appointment-db";
import {
  getClinicScheduleFromDisk,
  getSlotCapacityForDateTime,
  isDateAvailable,
  isSlotDisabledForDate,
} from "@/lib/clinic/clinic-weekly-hours-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date")?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)." }, { status: 400 });
  }

  const [schedule, counts] = await Promise.all([
    getClinicScheduleFromDisk(),
    countAppointmentsByDateAndTime(date),
  ]);

  const blocked = !isDateAvailable(date, schedule);
  const slots = schedule.timeSlots.map((time) => {
    const booked = counts[time] ?? 0;
    const disabled = isSlotDisabledForDate(date, time, schedule);
    const capacity = getSlotCapacityForDateTime(schedule, date, time);
    const full = booked >= capacity;
    return { time, booked, capacity, full, disabled, available: !disabled && !full };
  });
  const allFull = slots.length > 0 && slots.every((slot) => slot.full || slot.disabled);

  return NextResponse.json({
    date,
    blocked,
    allFull,
    slotCapacity: schedule.slotCapacity,
    slots,
  });
}
