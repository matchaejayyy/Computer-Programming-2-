import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { validatePasswordStrengthViaCpp } from "@/lib/auth/cpp-password-validator";
import { hashOtp } from "@/lib/auth/password-reset-otp";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = String((body as { email?: string })?.email ?? "")
    .trim()
    .toLowerCase();
  const otp = String((body as { otp?: string })?.otp ?? "").trim();
  const newPassword = String((body as { newPassword?: string })?.newPassword ?? "");
  const confirmPassword = String(
    (body as { confirmPassword?: string })?.confirmPassword ?? ""
  );

  if (!email || !otp || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Email, OTP, and new password fields are required." },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New password and confirmation do not match." },
      { status: 400 }
    );
  }
  const passwordCheck = validatePasswordStrengthViaCpp(newPassword);
  if (!passwordCheck.ok) {
    return NextResponse.json(
      { error: passwordCheck.message ?? "Password does not meet strength requirements." },
      { status: 400 }
    );
  }

  const latest = await prisma.passwordResetOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) {
    return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });
  }
  if (latest.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
  }
  if (hashOtp(email, otp) !== latest.codeHash) {
    return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, needsInitialPasswordSetup: false },
    }),
    prisma.passwordResetOtp.update({
      where: { id: latest.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
