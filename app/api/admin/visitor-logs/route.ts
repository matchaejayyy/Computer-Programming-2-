import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createVisitorLogRecord,
  listVisitorLogRecords,
} from "@/lib/clinic/visitor-log-records";

function toReference(id: number): string {
  return `VLOG-${String(id).padStart(4, "0")}`;
}

function visitorLogDelegate() {
  const p = prisma as unknown as {
    visitorLog?: {
      findMany: (args: unknown) => Promise<Array<{
        id: number;
        reference: string | null;
        name: string;
        email: string;
        department: string;
        course: string;
        year: string;
        time: string;
        purpose: string;
        loggedAt: Date;
      }>>;
      create: (args: unknown) => Promise<{ id: number }>;
      update: (args: unknown) => Promise<unknown>;
    };
  };
  return p.visitorLog;
}

export async function GET() {
  try {
    const delegate = visitorLogDelegate();
    if (delegate) {
      const rows = await delegate.findMany({
        orderBy: { loggedAt: "desc" },
      });
      return NextResponse.json({
        logs: rows.map((row) => ({
          id: row.reference || toReference(row.id),
          name: row.name,
          email: row.email,
          department: row.department,
          course: row.course,
          year: row.year,
          time: row.time,
          purpose: row.purpose,
          createdAt: row.loggedAt.toISOString(),
        })),
      });
    }
    return NextResponse.json({ logs: listVisitorLogRecords() });
  } catch (error) {
    // Fallback to native file/C++ listing if DB is unavailable.
    try {
      return NextResponse.json({ logs: listVisitorLogRecords() });
    } catch {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not load visitor logs." },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const department = typeof payload.department === "string" ? payload.department.trim() : "";
  const course = typeof payload.course === "string" ? payload.course.trim() : "";
  const year = typeof payload.year === "string" ? payload.year.trim() : "";
  const time = typeof payload.time === "string" ? payload.time.trim() : "";
  const purpose = typeof payload.purpose === "string" ? payload.purpose.trim() : "";
  const createdAt = typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString();

  if (!name || !email || !department || !course || !year || !time || !purpose) {
    return NextResponse.json(
      { error: "Name, email, department, course, year, time, and purpose are required." },
      { status: 400 }
    );
  }

  try {
    const loggedAt = Number.isNaN(new Date(createdAt).getTime()) ? new Date() : new Date(createdAt);
    const delegate = visitorLogDelegate();
    let reference: string | null = null;
    if (delegate) {
      const row = await delegate.create({
        data: {
          name,
          email,
          department,
          course,
          year,
          time,
          purpose,
          loggedAt,
        },
      });
      reference = toReference(row.id);
      await delegate.update({
        where: { id: row.id },
        data: { reference },
      });
    }

    // Keep native JSONL data in sync for C++-first fallback mode.
    const fileRow = createVisitorLogRecord({
      name,
      email,
      department,
      course,
      year,
      time,
      purpose,
      createdAt: loggedAt.toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        log: {
          id: reference || fileRow.id,
          name,
          email,
          department,
          course,
          year,
          time,
          purpose,
          createdAt: loggedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save visitor log." },
      { status: 500 }
    );
  }
}
