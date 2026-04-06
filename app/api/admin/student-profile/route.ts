import { NextResponse } from "next/server";

import { getBmi } from "@/lib/clinic/cpp-bmi";
import {
  getStudentFromRegistryFallback,
  getStudentFromRegistryViaCpp,
} from "@/lib/clinic/cpp-student-registry";
import {
  calculateAge,
  updateStudentProfileAdmin,
  type AdminStudentProfileUpdate,
} from "@/lib/clinic/profile-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const fromRegistry =
    getStudentFromRegistryViaCpp(studentId) ?? getStudentFromRegistryFallback(studentId);
  if (!fromRegistry) {
    return NextResponse.json({ error: "Student is not in the registry." }, { status: 404 });
  }

  const bmi = await getBmi(studentId);
  const age = calculateAge(fromRegistry.birthday);

  const bmiRecordedAt =
    typeof bmi.updatedAt === "number" && Number.isFinite(bmi.updatedAt)
      ? new Date(bmi.updatedAt * 1000).toISOString()
      : null;

  return NextResponse.json({
    success: true,
    data: {
      ...fromRegistry,
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

  const fromRegistry =
    getStudentFromRegistryViaCpp(studentId) ?? getStudentFromRegistryFallback(studentId);
  if (!fromRegistry) {
    return NextResponse.json({ error: "Student is not in the registry." }, { status: 404 });
  }

  const changes: AdminStudentProfileUpdate = {
    newStudentId: asOptionalString(raw.newStudentId),
    name: asOptionalString(raw.name),
    email: asOptionalString(raw.email),
    schoolIdNumber: asOptionalString(raw.schoolIdNumber),
    contactNumber: asOptionalString(raw.contactNumber),
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
    changes.birthday !== undefined ||
    changes.gender !== undefined ||
    changes.symptomsOrCondition !== undefined ||
    changes.birthdayEdited !== undefined ||
    changes.genderEdited !== undefined;

  if (!hasAny) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const updated = updateStudentProfileAdmin(studentId, changes);
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
