import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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

    const where: Record<string, unknown> = { role: "STUDENT" as const };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { profile: { schoolIdNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { name: "asc" },
    });

    const patients: AdminPatientListItem[] = users.map((u) => ({
      studentId: u.studentId ?? u.email,
      name: u.name,
      email: u.email,
      schoolIdNumber: u.profile?.schoolIdNumber || "",
      contactNumber: u.profile?.contactNumber || "",
      address: u.profile?.address || "",
      birthday: u.profile?.birthday || "",
      gender: u.profile?.gender || "",
      symptomsOrCondition: u.profile?.symptomsOrCondition || "",
    }));

    return NextResponse.json({
      success: true,
      patients,
      total: patients.length,
      source: "prisma",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load students." },
      { status: 500 }
    );
  }
}
