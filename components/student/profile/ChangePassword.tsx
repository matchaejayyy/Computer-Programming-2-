"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = "idle" | "verifyOld" | "setNew" | "forgot";

const PASSWORD_RULES = [
  {
    id: "len",
    label: "At least 8 characters",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "num",
    label: "One number (0–9)",
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "One special character (e.g. ! @ # $)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  id: string;
  label: string;
  autoComplete: ComponentProps<"input">["autoComplete"];
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className={cn(
            "absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

export function ProfileChangePassword() {
  const [step, setStep] = useState<Step>("idle");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function resetFlow(options?: { clearSuccess?: boolean }) {
    setStep("idle");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerifyError(null);
    setUpdateError(null);
    setForgotSent(false);
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    if (options?.clearSuccess !== false) {
      setSuccessMessage(null);
    }
  }

  function handleVerifyContinue(e: FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    if (!oldPassword.trim()) {
      setVerifyError("Enter your current password to continue.");
      return;
    }
    setStep("setNew");
    setUpdateError(null);
  }

  function handleUpdatePassword(e: FormEvent) {
    e.preventDefault();
    setUpdateError(null);
    if (newPassword !== confirmPassword) {
      setUpdateError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      setUpdateError(
        "New password must be different from your current password."
      );
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setUpdateError(
        "Use a stronger password — check the requirements below."
      );
      return;
    }
    // UI only — no API
    resetFlow({ clearSuccess: false });
    setSuccessMessage(
      "Preview: your password would be updated once sign-in is connected."
    );
  }

  function handleForgotSend(e: FormEvent) {
    e.preventDefault();
    setForgotSent(true);
  }

  if (step === "idle") {
    return (
      <div className="space-y-3 pt-2">
        {successMessage ? (
          <p
            className="rounded-lg border border-clinic-blue/30 bg-clinic-blue/5 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          To change your password, confirm your current one first. No changes
          are saved until the account system is connected.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-clinic-blue/25 bg-card sm:w-auto"
          onClick={() => {
            setSuccessMessage(null);
            setStep("verifyOld");
            setVerifyError(null);
          }}
        >
          <KeyRound className="size-4" aria-hidden />
          Reset password
        </Button>
      </div>
    );
  }

  if (step === "forgot") {
    return (
      <div className="space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          If you forgot your password, we can email a reset link to your
          registered address. This preview does not send mail yet.
        </p>
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <span className="text-muted-foreground">Registered email: </span>
          student@usa.edu.ph
        </p>
        {forgotSent ? (
          <p className="text-sm font-medium text-clinic-blue" role="status">
            Reset link would be sent here once email is connected.
          </p>
        ) : null}
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" onSubmit={handleForgotSend}>
          <Button type="submit" disabled={forgotSent}>
            {forgotSent ? "Link sent (preview)" : "Send reset link"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setForgotSent(false);
              setStep("verifyOld");
            }}
          >
            Back
          </Button>
        </form>
      </div>
    );
  }

  if (step === "verifyOld") {
    return (
      <form className="space-y-4 pt-2" onSubmit={handleVerifyContinue}>
        <PasswordField
          id="profile-current-password"
          label="Current password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={setOldPassword}
          show={showOld}
          onToggleShow={() => setShowOld((v) => !v)}
        />
        {verifyError ? (
          <p className="text-sm text-destructive" role="alert">
            {verifyError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="submit">Continue</Button>
          <Button type="button" variant="ghost" onClick={() => resetFlow()}>
            Cancel
          </Button>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-clinic-blue underline-offset-4 hover:underline"
          onClick={() => {
            setForgotSent(false);
            setStep("forgot");
          }}
        >
          Forgot password?
        </button>
      </form>
    );
  }

  // setNew
  return (
    <form className="space-y-4 pt-2" onSubmit={handleUpdatePassword}>
      <p className="text-sm text-muted-foreground">
        Current password accepted (preview). Choose your new password below.
      </p>
      <PasswordField
        id="profile-new-password"
        label="New password"
        autoComplete="new-password"
        value={newPassword}
        onChange={setNewPassword}
        show={showNew}
        onToggleShow={() => setShowNew((v) => !v)}
      />
      <div
        className="rounded-lg border border-border bg-card/50 px-3 py-2.5"
        aria-live="polite"
      >
        <p className="text-xs font-bold text-foreground">
          Strong password requirements
        </p>
        <ul className="mt-2 space-y-1.5 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(newPassword);
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex gap-2",
                  met ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                <span className="shrink-0 font-medium" aria-hidden>
                  {met ? "✓" : "○"}
                </span>
                <span>{rule.label}</span>
              </li>
            );
          })}
          <li
            className={cn(
              "flex gap-2",
              newPassword.length === 0 && "text-muted-foreground",
              newPassword.length > 0 &&
                newPassword === oldPassword &&
                "text-destructive",
              newPassword.length > 0 &&
                newPassword !== oldPassword &&
                "text-emerald-700 dark:text-emerald-400"
            )}
          >
            <span className="shrink-0 font-medium" aria-hidden>
              {newPassword.length === 0
                ? "○"
                : newPassword === oldPassword
                  ? "✗"
                  : "✓"}
            </span>
            <span>Must not match your current password</span>
          </li>
        </ul>
      </div>
      <PasswordField
        id="profile-confirm-password"
        label="Confirm new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirm}
        onToggleShow={() => setShowConfirm((v) => !v)}
      />
      {updateError ? (
        <p className="text-sm text-destructive" role="alert">
          {updateError}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Updates are not persisted until sign-in is connected to a server.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="submit">Update password</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep("verifyOld");
            setNewPassword("");
            setConfirmPassword("");
            setUpdateError(null);
          }}
        >
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={() => resetFlow()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
