import { NextResponse } from "next/server";

import { getBmi, updateBmi } from "@/lib/utils/helpers/cpp-bmi";

function parsePositiveNumber(input: unknown): number | null {
  const parsed = Number(input);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  try {
    const result = await getBmi(studentId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read BMI." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const studentId = String(raw.studentId ?? "").trim();
  const weightKg = parsePositiveNumber(raw.weightKg);
  const height = parsePositiveNumber(raw.height);

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }
  if (weightKg === null || height === null) {
    return NextResponse.json(
      { error: "weightKg and height must be positive numbers." },
      { status: 400 }
    );
  }

  try {
    const result = await updateBmi({ studentId, weightKg, height });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update BMI." },
      { status: 400 }
    );
  }
}
