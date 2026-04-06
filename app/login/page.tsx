"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getProviders, signIn, signOut } from "next-auth/react";
import { User, ShieldUser, ArrowLeft, Eye, EyeOff } from "lucide-react";

import { isBirthdayUnset, isProfileFieldUnset } from "@/lib/clinic/profile-placeholders";
import { isAllowedStudentEmail, STUDENT_EMAIL_DOMAIN } from "@/lib/clinic/student-email";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Role = "student" | "admin" | null;
type ProfileSetupPayload = {
  needsInitialPasswordSetup?: boolean;
  birthday?: string;
  gender?: string;
  schoolIdNumber?: string;
  address?: string;
};

function requiresStudentSetup(data: ProfileSetupPayload): boolean {
  return (
    Boolean(data.needsInitialPasswordSetup) ||
    isBirthdayUnset(data.birthday) ||
    isProfileFieldUnset(data.schoolIdNumber)
  );
}

function loginErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "UsaEmailOnly") {
    return `Only ${STUDENT_EMAIL_DOMAIN} email addresses can sign in to the student portal.`;
  }
  if (code === "GoogleAdminUsePassword") {
    return "Administrator accounts must sign in with email and password, not Google.";
  }
  if (code === "Configuration") {
    return "Sign-in is not configured. Check AUTH_SECRET and OAuth settings.";
  }
  if (code === "AccessDenied") {
    return `Google blocked sign-in. If the consent screen is in “Testing”, add your ${STUDENT_EMAIL_DOMAIN} address under OAuth consent screen → Test users. Or use email and password below.`;
  }
  if (code === "AccountDbError") {
    return "Could not save your account (database error). Check DATABASE_URL, run npm run db:push, and try again.";
  }
  return "Sign-in failed. Try again or use email and password.";
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = loginErrorMessage(params.get("error"));
    if (err) {
      setAuthError(err);
      setSelectedRole("student");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  async function handleGoogleSignIn() {
    setAuthError(null);
    const providers = await getProviders();
    if (!providers?.google) {
      setAuthError(
        "Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env.local (see comments in that file). Redirect URI in Google Cloud: http://localhost:3000/api/auth/callback/google — then restart the dev server."
      );
      return;
    }
    await signIn("google", { callbackUrl: "/", redirect: true });
  }

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRole) return;
    setAuthError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (selectedRole === "student" && !isAllowedStudentEmail(trimmedEmail)) {
      setAuthError(
        `Student login requires a University of San Agustin address ending in ${STUDENT_EMAIL_DOMAIN}.`
      );
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });
      if (result?.error) {
        setAuthError(
          selectedRole === "student"
            ? "Invalid password, or email is not @usa.edu.ph. First-time students: we create your account on successful sign-in."
            : "Invalid email or password, or this admin account does not exist."
        );
        return;
      }
      const r = await fetch("/api/auth/session");
      const session = (await r.json()) as { user?: { role?: string } };
      const role = session?.user?.role;
      if (selectedRole === "admin" && role !== "ADMIN") {
        await signOut({ redirect: false });
        setAuthError("This account is not an administrator.");
        return;
      }
      if (selectedRole === "student" && role !== "STUDENT") {
        await signOut({ redirect: false });
        setAuthError("This account is not a student account.");
        return;
      }
      if (selectedRole === "admin") {
        window.location.href = "/admin";
        return;
      }

      const studentSession = session?.user as { studentId?: string | null; email?: string | null };
      const profileLookupId = studentSession?.studentId || studentSession?.email || trimmedEmail;
      const profileRes = await fetch(
        `/api/profile?studentId=${encodeURIComponent(profileLookupId)}`
      );
      if (!profileRes.ok) {
        window.location.href = "/complete-profile";
        return;
      }
      const profileBody = (await profileRes.json()) as { data?: ProfileSetupPayload };
      if (requiresStudentSetup(profileBody?.data ?? {})) {
        window.location.href = "/complete-profile";
        return;
      }
      window.location.href = "/";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background font-sans">
      
      {/* 
        LEFT COLUMN (Form container)
        Translates to the right half when a role is selected 
      */}
      <div 
        className={`absolute top-0 left-0 w-full lg:w-1/2 h-full z-20 bg-slate-50/90 flex flex-col overflow-y-auto transition-transform duration-[800ms] ease-in-out ${
          selectedRole ? "lg:translate-x-full shadow-2xl" : "translate-x-0"
        }`}
      >
        {/* Subtle decorative background blobs to enhance the liquid crystal glassmorphism */}
        <div className="absolute top-[5%] -left-[5%] w-[450px] h-[450px] bg-[#1d4ed8]/15 rounded-full blur-[90px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-[10%] -right-[5%] w-[500px] h-[500px] bg-[#E50000]/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="w-full p-8 sm:p-12 pb-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-[#E50000] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            San Agustin Clinic
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-12 md:px-20 pb-16 min-h-max">
          {/* Content Wrapper (Crystal/Clear Container) */}
          <div className="w-full max-w-[500px] relative shrink-0 my-auto bg-gradient-to-br from-white/70 via-white/40 to-white/20 backdrop-blur-[40px] border-[1.5px] border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_0_32px_rgba(255,255,255,0.4)] rounded-[2.5rem] overflow-hidden">
          
          {/* Subtle shiny reflection ring inside the liquid crystal */}
          <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/50 pointer-events-none"></div>

          <div className="relative grid grid-cols-1 grid-rows-1 w-full p-8 sm:p-12">
            
            {/* Role Selection View */}
            <div className={`col-start-1 row-start-1 transition-all duration-500 flex flex-col justify-center ${
              selectedRole ? "opacity-0 invisible scale-95" : "opacity-100 visible scale-100"
            }`}>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Welcome, Agustinian!</h1>
              <p className="text-muted-foreground mb-10 text-[15px] leading-relaxed">
                Access your medical records, book appointments, and manage clinic services in one secure location.
              </p>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground/50">Login as</span>
                <div className="h-px flex-1 bg-neutral-200"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-left">
                <button
                  onClick={() => setSelectedRole("student")}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-neutral-200 bg-white hover:border-[#E50000] hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[#E50000] group-hover:text-white transition-colors text-neutral-600 shadow-none">
                    <User size={28} />
                  </div>
                  <div className="text-left w-full">
                    <h3 className="text-xl font-bold text-foreground">Student</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Access your health records</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedRole("admin")}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-neutral-200 bg-white hover:border-[#E50000] hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[#E50000] group-hover:text-white transition-colors text-neutral-600 shadow-none">
                    <ShieldUser size={28} />
                  </div>
                  <div className="text-left w-full">
                    <h3 className="text-xl font-bold text-foreground">Admin</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Manage clinic operations</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Login Form View */}
            <div className={`col-start-1 row-start-1 transition-all duration-500 flex flex-col justify-center delay-200 ${
              selectedRole ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
            }`}>
              <button 
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group w-fit"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold text-sm">Back to roles</span>
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Sign into your account
              </h2>
              <p className="text-muted-foreground mb-10 text-[15px] capitalize">
                Welcome back, please enter your {selectedRole} details.
              </p>

              {selectedRole === "student" ? (
                <div className="space-y-5 mb-8">
                  <button
                    type="button"
                    onClick={() => void handleGoogleSignIn()}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-neutral-200 bg-white text-foreground font-semibold text-[15px] shadow-sm hover:border-neutral-300 hover:shadow-md transition-all"
                  >
                    <GoogleGlyph className="w-5 h-5 shrink-0" />
                    Continue with Google
                  </button>
                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    Use your <span className="font-semibold text-foreground">{STUDENT_EMAIL_DOMAIN}</span> Google
                    account.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-neutral-200" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>
                </div>
              ) : null}

              {authError && selectedRole ? (
                <p className="text-sm font-medium text-red-600 mb-4" role="alert">
                  {authError}
                </p>
              ) : null}

              <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder={selectedRole === "student" ? "Email" : "Admin email"}
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-neutral-200 bg-white text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-[#E50000] focus:border-transparent transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Password"
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                      className="w-full px-5 py-4 pr-12 rounded-xl border border-neutral-200 bg-white text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-[#E50000] focus:border-transparent transition-all shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#E50000] transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl text-white font-bold text-[15px] shadow-sm hover:shadow-md hover:bg-neutral-800 transition-all bg-[#0a0a0a] disabled:opacity-60"
                  >
                    {submitting ? "Signing in…" : "Log In"}
                  </button>
                  <div className="text-center">
                    <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-[#E50000] transition-colors hover:underline">
                      Forgot password?
                    </a>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* 
      RIGHT COLUMN (Image container)
      Translates to the left half when a role is selected
    */}
    <div 
        className={`hidden lg:block absolute top-0 right-0 w-1/2 h-full z-0 bg-neutral-900 overflow-hidden transition-transform duration-[800ms] ease-in-out ${
          selectedRole ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/USA.webp"
            alt="University of San Agustin"
            fill
            className="object-cover scale-105"
            priority
          />
          {/* Enhanced darken overlay for better contrast and sleeker look */}
          <div className="absolute inset-0 bg-black/55 z-10"></div>
          
          {/* A sleek subtle red accent glow at the corner to maintain brand connection */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#E50000]/40 blur-[100px] rounded-full z-10 mix-blend-screen pointer-events-none"></div>
        </div>
      </div>

    </div>
  );
}
