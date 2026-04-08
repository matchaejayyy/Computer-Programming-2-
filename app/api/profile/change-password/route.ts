import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
  const currentPassword = String(raw.currentPassword ?? "").trim();
  const newPassword = String(raw.newPassword ?? "").trim();
  const confirmPassword = String(raw.confirmPassword ?? "").trim();
  const verifyOnly = raw.verifyOnly === true;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const needsInitialSetup = Boolean(user.needsInitialPasswordSetup || !user.passwordHash);

  if (verifyOnly) {
    if (needsInitialSetup) {
      return NextResponse.json(
        { error: "No current password is required for initial password setup." },
        { status: 400 }
      );
    }
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ error: "No password is set for this account." }, { status: 400 });
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (!newPassword) {
    return NextResponse.json({ error: "New password is required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (needsInitialSetup) {
    if (!confirmPassword || confirmPassword !== newPassword) {
      return NextResponse.json(
        { error: "New password and confirmation must match." },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, needsInitialPasswordSetup: false },
    });
    return NextResponse.json({ success: true });
  }

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        error:
          "No password is set for this account. Use create password if available, or sign in with Google.",
      },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, needsInitialPasswordSetup: false },
  });

  return NextResponse.json({ success: true });
}
