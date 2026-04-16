import { NextResponse } from "next/server";

import { getBmi } from "@/lib/utils/helpers/cpp-bmi";
import {
  calculateAge,
  getStudentProfile,
  updateStudentProfileAdmin,
  type AdminStudentProfileUpdate,
} from "@/lib/repositories/student/profile-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const fromProfileStore = await getStudentProfile(studentId);
  if (!fromProfileStore) {
    return NextResponse.json({ error: "Student is not in the registry." }, { status: 404 });
  }

  const bmi = await getBmi(fromProfileStore.studentId);
  const age = calculateAge(fromProfileStore.birthday);

  const bmiRecordedAt =
    typeof bmi.updatedAt === "number" && Number.isFinite(bmi.updatedAt)
      ? new Date(bmi.updatedAt * 1000).toISOString()
      : null;

  return NextResponse.json({
    success: true,
    data: {
      ...fromProfileStore,
      age,
      bmi: bmi.bmi ?? null,
      bmiCategory: bmi.category ?? null,
      weightKg: bmi.weightKg ?? null,
      heightM: bmi.heightM ?? null,
      heightCm:
        typeof bmi.heightM === "number" && Number.isFinite(bmi.heightM)
          ? Math.round(bmi.heightM * 1000) / 10
          : null,
      bmiRecordedAt,
    },
  });
}

function asOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  return v;
}

function asOptionalBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
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

  const existing = await getStudentProfile(studentId);
  if (!existing) {
    return NextResponse.json({ error: "Student is not in the registry." }, { status: 404 });
  }

  const changes: AdminStudentProfileUpdate = {
    newStudentId: asOptionalString(raw.newStudentId),
    name: asOptionalString(raw.name),
    email: asOptionalString(raw.email),
    schoolIdNumber: asOptionalString(raw.schoolIdNumber),
    contactNumber: asOptionalString(raw.contactNumber),
    address: asOptionalString(raw.address),
    birthday: asOptionalString(raw.birthday),
    gender: asOptionalString(raw.gender),
    symptomsOrCondition: asOptionalString(raw.symptomsOrCondition),
    birthdayEdited: asOptionalBool(raw.birthdayEdited),
    genderEdited: asOptionalBool(raw.genderEdited),
  };

  const hasAny =
    changes.newStudentId !== undefined ||
    changes.name !== undefined ||
    changes.email !== undefined ||
    changes.schoolIdNumber !== undefined ||
    changes.contactNumber !== undefined ||
    changes.address !== undefined ||
    changes.birthday !== undefined ||
    changes.gender !== undefined ||
    changes.symptomsOrCondition !== undefined ||
    changes.birthdayEdited !== undefined ||
    changes.genderEdited !== undefined;

  if (!hasAny) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const updated = await updateStudentProfileAdmin(studentId, changes);
    const bmi = await getBmi(updated.studentId);
    const age = calculateAge(updated.birthday);

    const bmiRecordedAt =
      typeof bmi.updatedAt === "number" && Number.isFinite(bmi.updatedAt)
        ? new Date(bmi.updatedAt * 1000).toISOString()
        : null;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        age,
        bmi: bmi.bmi ?? null,
        bmiCategory: bmi.category ?? null,
        weightKg: bmi.weightKg ?? null,
        heightM: bmi.heightM ?? null,
        heightCm:
          typeof bmi.heightM === "number" && Number.isFinite(bmi.heightM)
            ? Math.round(bmi.heightM * 1000) / 10
            : null,
        bmiRecordedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile." },
      { status: 400 }
    );
  }
}
