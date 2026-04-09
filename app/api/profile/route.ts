import { NextResponse } from "next/server";

import { Role } from "@prisma/client";

import { calculateAge, getStudentProfile, updateStudentProfile } from "@/lib/clinic/profile-store";
import { getBmi } from "@/lib/clinic/cpp-bmi";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const profile = await getStudentProfile(studentId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const [userRow, bmi] = await Promise.all([
    prisma.user.findFirst({
      where: {
        role: Role.STUDENT,
        OR: [{ studentId }, { email: studentId }],
      },
      select: { needsInitialPasswordSetup: true, passwordHash: true },
    }),
    getBmi(profile.studentId),
  ]);

  const needsInitialPasswordSetup = Boolean(
    userRow?.needsInitialPasswordSetup || !userRow?.passwordHash
  );
  const age = calculateAge(profile.birthday);

  return NextResponse.json({
    success: true,
    data: {
      ...profile,
      needsInitialPasswordSetup,
      age,
      bmi: bmi.bmi,
      bmiCategory: bmi.category,
      weightKg: bmi.weightKg,
      heightM: bmi.heightM,
    },
  });
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const studentId = String(raw.studentId ?? "").trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  try {
    const updated = await updateStudentProfile(studentId, {
      birthday: typeof raw.birthday === "string" ? raw.birthday : undefined,
      gender: typeof raw.gender === "string" ? raw.gender : undefined,
      address: typeof raw.address === "string" ? raw.address : undefined,
      contactNumber:
        typeof raw.contactNumber === "string" ? raw.contactNumber : undefined,
      schoolIdNumber:
        typeof raw.schoolIdNumber === "string" ? raw.schoolIdNumber : undefined,
      symptomsOrCondition:
        typeof raw.symptomsOrCondition === "string"
          ? raw.symptomsOrCondition
          : undefined,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile." },
      { status: 400 }
    );
  }
}
