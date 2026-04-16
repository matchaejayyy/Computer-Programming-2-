import { NextResponse } from "next/server";

import { getClinicScheduleFromDisk } from "@/lib/repositories/schedule/clinic-weekly-hours-store";

export async function GET() {
  try {
    const data = await getClinicScheduleFromDisk();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { rows: [], timeSlots: [], blockedDates: [], slotCapacity: 10 },
      { status: 200 }
    );
  }
}
