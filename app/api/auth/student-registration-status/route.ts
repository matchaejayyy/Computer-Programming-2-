import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = String(searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true, passwordHash: true },
  });

  const isRegisteredStudent = Boolean(user && user.role === "STUDENT");
  const hasPassword = Boolean(user?.passwordHash);

  return NextResponse.json({
    success: true,
    registered: isRegisteredStudent,
    hasPassword,
  });
}
