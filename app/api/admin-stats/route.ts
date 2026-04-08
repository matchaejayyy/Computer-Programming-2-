import { NextResponse } from "next/server";

import { appointmentStats } from "@/lib/clinic/appointment-records";

export async function GET() {
  try {
    return NextResponse.json(await appointmentStats());
  } catch {
    return NextResponse.json(
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        no_show: 0,
        completed: 0,
      },
      { status: 200 }
    );
  }
}
