import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { isAllowedStudentEmail } from "@/lib/clinic/student-email";
import { DEFAULT_STUDENT_PROFILE_DATA } from "@/lib/clinic/profile-placeholders";
import { ensureStudentProfileIfMissing } from "@/lib/clinic/profile-store";
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

/** Google sign-in: ensure STUDENT + StudentProfile exist and require first password setup. */
async function ensureStudentUserForGoogle(
  email: string,
  displayName: string | null | undefined
) {
  const normalizedEmail = email.trim().toLowerCase();
  const name =
    displayName?.trim() || normalizedEmail.split("@")[0] || "Student";

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
          needsInitialPasswordSetup: !existing.passwordHash ? true : undefined,
          profile: {
            create: { ...DEFAULT_STUDENT_PROFILE_DATA },
          },
        },
      });
    } else if (!existing.passwordHash) {
      await userModel.update({
        where: { id: existing.id },
        data: { needsInitialPasswordSetup: true },
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

  const created = await userModel.create({
    data: {
      email: normalizedEmail,
      name,
      role: "STUDENT",
      passwordHash: null,
      needsInitialPasswordSetup: true,
      profile: {
        create: { ...DEFAULT_STUDENT_PROFILE_DATA },
      },
    },
  });

  return { kind: "student" as const, user: created };
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Student";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
  Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  jwt: {
    maxAge: 60 * 60 * 24,
  },
  // Logs the Google authorization URL (includes redirect_uri) in the terminal on each OAuth start.
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(googleConfigured ? [Google] : []),
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) {
          return null;
        }
        const studentDomain = isAllowedStudentEmail(email);
        let user = await userModel.findUnique({ where: { email } });

        if (!user) {
          if (!studentDomain) {
            return null;
          }
          const passwordHash = await bcrypt.hash(password, 10);
          user = await userModel.create({
            data: {
              email,
              name: displayNameFromEmail(email),
              role: "STUDENT",
              passwordHash,
              needsInitialPasswordSetup: true,
              profile: {
                create: { ...DEFAULT_STUDENT_PROFILE_DATA },
              },
            },
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentId: user.studentId,
          };
        }

        if (user.role === "STUDENT" && !studentDomain) {
          return null;
        }

        if (!user.passwordHash) {
          if (user.role !== "STUDENT" || !studentDomain) {
            return null;
          }
          const passwordHash = await bcrypt.hash(password, 10);
          user = await userModel.update({
            where: { id: user.id },
            data: { passwordHash, needsInitialPasswordSetup: false },
          });
          await ensureStudentProfileIfMissing(user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            studentId: user.studentId,
          };
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          return null;
        }

        if (user.role === "STUDENT") {
          await ensureStudentProfileIfMissing(user.id);
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase() ?? "";
        if (!email || !isAllowedStudentEmail(email)) {
          return "/login?error=UsaEmailOnly";
        }
        try {
          const outcome = await ensureStudentUserForGoogle(email, user.name);
          if (outcome.kind === "admin") {
            return "/login?error=GoogleAdminUsePassword";
          }
        } catch (err) {
          console.error("[auth] Google sign-in database error:", err);
          return "/login?error=AccountDbError";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const email = user.email.trim().toLowerCase();
        const dbUser = await userModel.findUnique({ where: { email } });
        if (dbUser?.role === "STUDENT") {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.studentId = dbUser.studentId;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
        return token;
      }
      if (user) {
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as typeof session.user.role;
        session.user.studentId = (token.studentId as string | null) ?? null;
      }
      return session;
    },
  },
});
