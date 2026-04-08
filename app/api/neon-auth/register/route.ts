import { NextResponse } from "next/server";

import { ensureStudentUserAccount } from "@/lib/auth/student-account";
import { neonAuth } from "@/lib/auth/neon-server";
import { isAllowedStudentEmail } from "@/lib/clinic/student-email";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RegisterBody;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, and password are required." },
      { status: 400 }
    );
  }

  if (!isAllowedStudentEmail(email)) {
    return NextResponse.json(
      { error: "Only approved student emails can register." },
      { status: 400 }
    );
  }

  const signup = await neonAuth.signUp.email({
    name,
    email,
    password,
  });

  if (signup.error) {
    return NextResponse.json(
      { error: signup.error.message || "Failed to register account." },
      { status: 400 }
    );
  }

  try {
    const userResult = await ensureStudentUserAccount(email, name, {
      needsInitialPasswordSetup: false,
    });
    if (userResult.kind === "admin") {
      return NextResponse.json(
        { error: "Administrator accounts cannot use student registration." },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("[neon-auth/register] Failed syncing app user:", error);
    return NextResponse.json(
      {
        error:
          "Neon account was created but app profile sync failed. Contact support.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
