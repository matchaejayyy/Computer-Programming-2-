import { NextResponse } from "next/server";

import { getWeeklyClinicHoursFromDisk } from "@/lib/clinic/clinic-weekly-hours-store";

export async function GET() {
  try {
    const rows = getWeeklyClinicHoursFromDisk();
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }
}
