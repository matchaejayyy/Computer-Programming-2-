import { NextResponse } from "next/server";

import {
  generateOtpCode,
  hashOtp,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from "@/lib/services/auth/password-reset-otp";
import { isAllowedStudentEmail } from "@/lib/repositories/student/student-email";
import { sendPasswordResetOtpEmail } from "@/lib/services/auth/send-password-reset-otp";
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
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!isAllowedStudentEmail(email)) {
    return NextResponse.json(
      { error: "Use your USA email account." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, role: true },
  });
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json(
      {
        error:
          "Account is not yet registered. Please continue with Google.",
      },
      { status: 400 }
    );
  }

  const latest = await prisma.passwordResetOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  if (latest && latest.resendAvailableAt.getTime() > now.getTime()) {
    const retryAfterSeconds = Math.ceil(
      (latest.resendAvailableAt.getTime() - now.getTime()) / 1000
    );
    return NextResponse.json(
      { error: "Please wait before requesting another OTP.", retryAfterSeconds },
      { status: 429 }
    );
  }

  const otp = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);
  const resendAvailableAt = new Date(
    now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000
  );

  await prisma.passwordResetOtp.create({
    data: {
      email,
      codeHash: hashOtp(email, otp),
      expiresAt,
      resendAvailableAt,
    },
  });

  try {
    await sendPasswordResetOtpEmail({
      to: email,
      name: user.name || "Student",
      otp,
    });
  } catch (error) {
    console.error("[forgot-password/request] Failed to send OTP email:", error);
    const details =
      error instanceof Error
        ? error.message
        : "Failed to send OTP email. Please try again.";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? details
            : "Failed to send OTP email. Please try again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  });
}
