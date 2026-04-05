import { NextResponse } from "next/server";

import {
  getWeeklyClinicHoursFromDisk,
  saveWeeklyClinicHours,
  type WeeklyHourRow,
} from "@/lib/clinic/clinic-weekly-hours-store";

export async function GET() {
  try {
    const rows = getWeeklyClinicHoursFromDisk();
    return NextResponse.json({ rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read schedule." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const rowsUnknown = (body as { rows?: unknown }).rows;
  if (!Array.isArray(rowsUnknown)) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  const rows: WeeklyHourRow[] = [];
  for (const item of rowsUnknown) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const r = item as { label?: unknown; hours?: unknown };
    if (typeof r.label !== "string" || typeof r.hours !== "string") {
      continue;
    }
    const label = r.label.trim();
    const hours = r.hours.trim();
    if (!label || !hours) {
      continue;
    }
    rows.push({ label, hours });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "At least one row is required." }, { status: 400 });
  }

  try {
    await saveWeeklyClinicHours(rows);
    return NextResponse.json({ success: true, rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 500 }
    );
  }
}
