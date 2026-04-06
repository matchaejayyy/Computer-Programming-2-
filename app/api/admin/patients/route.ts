import { NextResponse } from "next/server";

import {
  listStudentsTypeScriptFallback,
  listStudentsViaCpp,
} from "@/lib/clinic/cpp-student-registry";
import { listStoredStudentProfiles } from "@/lib/clinic/profile-store";

export type AdminPatientListItem = {
  studentId: string;
  name: string;
  email: string;
  schoolIdNumber: string;
  contactNumber: string;
  address: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const viaCpp = await listStudentsViaCpp(q);
    const raw = viaCpp ?? (await listStudentsTypeScriptFallback(q));
    const rows = [...raw].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    const profiles = await listStoredStudentProfiles();
    const normalize = (v: string) => v.trim().toLowerCase();
    const profileByLogin = new Map<string, (typeof profiles)[number]>();
    for (const p of profiles) {
      profileByLogin.set(p.studentId, p);
      profileByLogin.set(p.email, p);
      profileByLogin.set(normalize(p.studentId), p);
      profileByLogin.set(normalize(p.email), p);
    }

    const patients: AdminPatientListItem[] = rows.map((row) => {
      const profile =
        profileByLogin.get(row.studentId) ??
        profileByLogin.get(row.email) ??
        profileByLogin.get(normalize(row.studentId)) ??
        profileByLogin.get(normalize(row.email));
      return {
        studentId: row.studentId,
        name: row.name,
        email: row.email,
        schoolIdNumber: row.schoolIdNumber || profile?.schoolIdNumber || "",
        contactNumber: profile?.contactNumber || "",
        address: profile?.address || "",
        birthday: profile?.birthday || "",
        gender: profile?.gender || "",
        symptomsOrCondition: profile?.symptomsOrCondition || "",
      };
    });

    return NextResponse.json({
      success: true,
      patients,
      total: rows.length,
      source: viaCpp ? "cpp" : "typescript",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load students." },
      { status: 500 }
    );
  }
}
