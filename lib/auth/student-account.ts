import { DEFAULT_STUDENT_PROFILE_DATA } from "@/lib/clinic/profile-placeholders";
import { ensureNeonAuthUser } from "@/lib/auth/neon-user-sync";
import { prisma } from "@/lib/prisma";

type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  studentId: string | null;
  passwordHash: string | null;
};

type AuthUserWithProfile = AuthUserRecord & {
  profile?: unknown | null;
};

type PrismaUserDelegate = {
  findUnique(args: unknown): Promise<AuthUserWithProfile | null>;
  findUniqueOrThrow(args: unknown): Promise<AuthUserRecord>;
  update(args: unknown): Promise<AuthUserRecord>;
  create(args: unknown): Promise<AuthUserRecord>;
};

const userModel = (prisma as unknown as { user: PrismaUserDelegate }).user;

export async function ensureStudentUserAccount(
  email: string,
  displayName: string | null | undefined,
  opts?: { needsInitialPasswordSetup?: boolean }
) {
  const normalizedEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || normalizedEmail.split("@")[0] || "Student";
  const needsInitialPasswordSetup = opts?.needsInitialPasswordSetup ?? true;

  const existing = await userModel.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });
  if (existing?.role === "ADMIN") {
    return { kind: "admin" as const };
  }
  if (existing?.role === "STUDENT") {
    if (!existing.profile) {
      await userModel.update({
        where: { id: existing.id },
        data: {
          needsInitialPasswordSetup: !existing.passwordHash ? needsInitialPasswordSetup : undefined,
          profile: {
            create: { ...DEFAULT_STUDENT_PROFILE_DATA },
          },
        },
      });
    } else if (!existing.passwordHash) {
      await userModel.update({
        where: { id: existing.id },
        data: { needsInitialPasswordSetup },
      });
    }

    const fresh = await userModel.findUniqueOrThrow({
      where: { id: existing.id },
    });
    const updated =
      fresh.name === name
        ? fresh
        : await userModel.update({
            where: { id: fresh.id },
            data: { name },
          });
    return { kind: "student" as const, user: updated };
  }

  try {
    await ensureNeonAuthUser(normalizedEmail, name);
  } catch (err) {
    console.warn("[student-account] Neon Auth sync before user creation:", err);
  }

  const created = await userModel.create({
    data: {
      email: normalizedEmail,
      name,
      role: "STUDENT",
      passwordHash: null,
      needsInitialPasswordSetup,
      profile: {
        create: { ...DEFAULT_STUDENT_PROFILE_DATA },
      },
    },
  });

  return { kind: "student" as const, user: created };
}
