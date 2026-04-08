import { NextResponse } from "next/server";

import {
  getClinicScheduleFromDisk,
  saveClinicSchedule,
  type ClinicScheduleData,
  type WeeklyHourRow,
} from "@/lib/clinic/clinic-weekly-hours-store";

export async function GET() {
  try {
    const data = await getClinicScheduleFromDisk();
    return NextResponse.json(data);
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

  const current = await getClinicScheduleFromDisk();
  const b = body as Record<string, unknown>;

  let rows: WeeklyHourRow[] = current.rows;
  if (Array.isArray(b.rows)) {
    const next: WeeklyHourRow[] = [];
    for (const item of b.rows) {
      if (!item || typeof item !== "object") continue;
      const r = item as { label?: unknown; hours?: unknown };
      if (typeof r.label !== "string" || typeof r.hours !== "string") continue;
      const label = r.label.trim();
      const hours = r.hours.trim();
      if (!label || !hours) continue;
      next.push({ label, hours });
    }
    if (next.length > 0) {
      rows = next;
    }
  }

  let timeSlots = current.timeSlots;
  if (Array.isArray(b.timeSlots)) {
    const ts = b.timeSlots
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
    if (ts.length > 0) timeSlots = ts;
  }

  let blockedDates = current.blockedDates;
  if (Array.isArray(b.blockedDates)) {
    const bd = b.blockedDates
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
    blockedDates = bd;
  }

  let slotCapacity = current.slotCapacity;
  if (b.slotCapacity !== undefined) {
    const parsed = Number(b.slotCapacity);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return NextResponse.json({ error: "slotCapacity must be a positive number." }, { status: 400 });
    }
    slotCapacity = Math.floor(parsed);
  }

  let dateOverrides = current.dateOverrides;
  if (Array.isArray(b.dateOverrides)) {
    dateOverrides = b.dateOverrides
      .filter((x): x is { date: string; available: boolean } => !!x && typeof x === "object")
      .map((x) => ({
        date: String(x.date ?? "").trim(),
        available: Boolean(x.available),
      }))
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date));
  }

  let disabledSlotsByDate = current.disabledSlotsByDate;
  if (b.disabledSlotsByDate && typeof b.disabledSlotsByDate === "object") {
    const next: Record<string, string[]> = {};
    for (const [date, slotsRaw] of Object.entries(b.disabledSlotsByDate as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (!Array.isArray(slotsRaw)) continue;
      const slots = slotsRaw
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter(Boolean);
      next[date] = Array.from(new Set(slots));
    }
    disabledSlotsByDate = next;
  }

  let slotCapacityByDateTime = current.slotCapacityByDateTime;
  if (b.slotCapacityByDateTime && typeof b.slotCapacityByDateTime === "object") {
    const next: Record<string, Record<string, number>> = {};
    for (const [date, perSlotRaw] of Object.entries(
      b.slotCapacityByDateTime as Record<string, unknown>
    )) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      if (!perSlotRaw || typeof perSlotRaw !== "object") continue;
      const perSlot: Record<string, number> = {};
      for (const [time, capRaw] of Object.entries(perSlotRaw as Record<string, unknown>)) {
        const cap = Number(capRaw);
        const timeKey = time.trim();
        if (!timeKey || !Number.isFinite(cap) || cap < 1) continue;
        perSlot[timeKey] = Math.floor(cap);
      }
      next[date] = perSlot;
    }
    slotCapacityByDateTime = next;
  }

  const data: ClinicScheduleData = {
    rows,
    timeSlots,
    blockedDates,
    slotCapacity,
    dateOverrides,
    disabledSlotsByDate,
    slotCapacityByDateTime,
  };

  if (data.rows.length === 0) {
    return NextResponse.json({ error: "At least one weekly row is required." }, { status: 400 });
  }

  try {
    await saveClinicSchedule(data);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
      { status: 500 }
    );
  }
}
