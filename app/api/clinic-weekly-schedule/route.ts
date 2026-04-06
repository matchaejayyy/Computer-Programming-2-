import { NextResponse } from "next/server";

import { getClinicScheduleFromDisk } from "@/lib/clinic/clinic-weekly-hours-store";

export async function GET() {
  try {
    const data = await getClinicScheduleFromDisk();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { rows: [], timeSlots: [], blockedDates: [], slotCapacity: 10 },
      { status: 200 }
    );
  }
}
