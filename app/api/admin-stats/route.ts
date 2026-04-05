import { NextResponse } from "next/server";

import { appointmentStats } from "@/lib/clinic/appointment-records";

export async function GET() {
  try {
    return NextResponse.json(appointmentStats());
  } catch {
    return NextResponse.json(
      { total: 0, pending: 0, approved: 0, rejected: 0 },
      { status: 200 }
    );
  }
}
