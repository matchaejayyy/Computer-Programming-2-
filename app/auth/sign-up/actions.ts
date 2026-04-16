"use server";

import { redirect } from "next/navigation";

import { ensureStudentUserAccount } from "@/lib/services/auth/student-account";
import { auth } from "@/lib/services/auth/server";
import { isAllowedStudentEmail } from "@/lib/repositories/student/student-email";

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { error: "Email address must be provided." };
  }

  if (!name) {
    return { error: "Name must be provided." };
  }

  if (!password) {
    return { error: "Password must be provided." };
  }

  if (!isAllowedStudentEmail(email)) {
    return { error: "Only approved student emails can register." };
  }

  const { error } = await auth.signUp.email({
    email,
    name,
    password,
  });

  if (error) {
    return { error: error.message || "Failed to create account." };
  }

  try {
    const userResult = await ensureStudentUserAccount(email, name, {
      needsInitialPasswordSetup: false,
    });
    if (userResult.kind === "admin") {
      return { error: "Administrator account already exists for this email." };
    }
  } catch {
    return { error: "Account created, but profile setup failed. Please contact support." };
  }

  redirect("/");
}
