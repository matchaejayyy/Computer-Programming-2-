import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { ensureNeonAuthUser } from "@/lib/auth/neon-user-sync";
import { ensureStudentUserAccount } from "@/lib/auth/student-account";
import { isAllowedStudentEmail } from "@/lib/clinic/student-email";
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
};

const userModel = (prisma as unknown as { user: PrismaUserDelegate }).user;

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
        const user = await userModel.findUnique({ where: { email } });

        if (!user) {
          return null;
        }

        if (user.role === "STUDENT" && !studentDomain) {
          return null;
        }

        if (!user.passwordHash) {
          return null;
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
        const displayName = user.name?.trim() || email.split("@")[0] || "Student";
        try {
          await ensureNeonAuthUser(email, displayName);
        } catch (err) {
          console.warn("[auth] Neon auth sync warning (non-blocking):", err);
        }
        try {
          const outcome = await ensureStudentUserAccount(email, user.name, {
            needsInitialPasswordSetup: true,
          });
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
