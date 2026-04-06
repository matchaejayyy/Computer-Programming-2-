import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Student session → default reserve form fields (from profile when present). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    studentName: user.name,
    email: user.email,
    schoolIdNumber: user.profile?.schoolIdNumber ?? "",
    address: user.profile?.address ?? "",
  });
}
