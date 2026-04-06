import { NextResponse } from "next/server";

import {
  listStudentsTypeScriptFallback,
  listStudentsViaCpp,
} from "@/lib/clinic/cpp-student-registry";

const LIMIT = 400;

export type AdminPatientListItem = {
  studentId: string;
  name: string;
  email: string;
  schoolIdNumber: string;
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

    const capped = rows.length > LIMIT;
    const slice = rows.slice(0, LIMIT);

    return NextResponse.json({
      success: true,
      patients: slice,
      total: rows.length,
      capped,
      source: viaCpp ? "cpp" : "typescript",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load students." },
      { status: 500 }
    );
  }
}
