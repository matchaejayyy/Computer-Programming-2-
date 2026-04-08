"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
          {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function AdminChangePassword() {
  const [started, setStarted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function resetForm() {
    setStarted(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerified(false);
    setSaving(false);
    setError(null);
  }

  async function verifyCurrentPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!currentPassword.trim()) {
      setError("Current password is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, verifyOnly: true }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Failed to verify password.");
      setVerified(true);
      setMessage("Current password verified. Set your new password below.");
    } catch (err) {
      setVerified(false);
      setError(err instanceof Error ? err.message : "Failed to verify password.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!verified) {
      setError("Confirm your current password first.");
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("New password and confirmation are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Failed to update password.");
      resetForm();
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {message}
        </p>
      ) : null}
      {!started ? (
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setStarted(true);
            setError(null);
            setMessage(null);
          }}
        >
          <KeyRound className="size-4" aria-hidden />
          Reset password
        </Button>
      ) : null}
      {started && !verified ? (
        <form className="space-y-3" onSubmit={verifyCurrentPassword}>
          <PasswordField
            id="admin-current-password"
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((prev) => !prev)}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Checking..." : "Confirm current password"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {started && verified ? (
        <form className="space-y-3" onSubmit={updatePassword}>
          <PasswordField
            id="admin-new-password"
            label="New password"
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((prev) => !prev)}
          />
          <PasswordField
            id="admin-confirm-password"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((prev) => !prev)}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save new password"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
