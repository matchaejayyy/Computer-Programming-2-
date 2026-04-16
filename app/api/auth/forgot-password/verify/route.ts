import { NextResponse } from "next/server";

import { hashOtp } from "@/lib/services/auth/password-reset-otp";
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
  if (!email || !otp) {
    return NextResponse.json(
      { error: "Email and OTP are required." },
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

  return NextResponse.json({ success: true });
}
