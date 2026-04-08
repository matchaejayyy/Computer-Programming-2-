"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Step = "request" | "verify" | "reset" | "done";

const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "num", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const passwordRuleStates = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(newPassword) })),
    [newPassword]
  );

  async function startCooldown(seconds: number) {
    setCooldownLeft(seconds);
    for (let i = seconds - 1; i >= 0; i -= 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCooldownLeft(i);
    }
  }

  async function requestOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json()) as {
        error?: string;
        retryAfterSeconds?: number;
        cooldownSeconds?: number;
      };
      if (!res.ok) {
        if (res.status === 429) {
          const seconds = body.retryAfterSeconds ?? 60;
          setError(`Please wait ${seconds}s before requesting a new OTP.`);
          void startCooldown(seconds);
          return;
        }
        setError(body.error ?? "Failed to send OTP.");
        return;
      }
      setMessage("OTP sent. Check your email.");
      setStep("verify");
      void startCooldown(body.cooldownSeconds ?? 60);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Invalid OTP.");
        return;
      }
      setStep("reset");
      setMessage("OTP verified. Set your new password.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Failed to reset password.");
        return;
      }
      setStep("done");
      setMessage("Password updated successfully. You can now log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Reset your account using a 6-digit OTP sent to your email.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      {step === "request" ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void requestOtp();
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@usa.edu.ph"
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyOtp();
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-md border px-3 py-2 tracking-[0.3em]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            type="button"
            disabled={cooldownLeft > 0 || loading}
            onClick={() => void requestOtp()}
            className="w-full rounded-md border px-3 py-2 disabled:opacity-60"
          >
            {cooldownLeft > 0 ? `Resend OTP in ${cooldownLeft}s` : "Resend OTP"}
          </button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void resetPassword();
          }}
        >
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-md border px-3 py-2 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-md border px-3 py-2 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="rounded-md border p-3 text-xs">
            {passwordRuleStates.map((rule) => (
              <p key={rule.id} className={rule.met ? "text-emerald-700" : "text-muted-foreground"}>
                {rule.met ? "✓" : "○"} {rule.label}
              </p>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700 underline">
          Back to login
        </Link>
      ) : (
        <Link href="/login" className="mt-6 inline-block text-sm text-muted-foreground underline">
          Back to login
        </Link>
      )}
    </main>
  );
}
