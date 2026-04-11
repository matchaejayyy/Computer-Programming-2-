"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type StudentAccountProfileDetail = {
  studentId: string;
  name: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
  contactNumber: string;
  email: string;
  schoolIdNumber: string;
  address?: string;
  birthdayEdited?: boolean;
  genderEdited?: boolean;
  age: number | null;
  bmi: number | null;
  bmiCategory?: string | null;
  weightKg: number | null;
  heightM: number | null;
  heightCm: number | null;
  bmiRecordedAt: string | null;
};

function formatRecordedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

const sectionTitle =
  "text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-sm";
const dtClass = "text-xs font-bold text-muted-foreground sm:text-sm";
const ddClass =
  "mt-1 text-sm font-medium text-foreground sm:mt-1.5 sm:text-base md:text-lg";
const cardPad =
  "rounded-lg border border-neutral-200 p-4 sm:p-5 md:p-6";

const textareaClass = cn(
  "flex min-h-[100px] w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
);

type Props = {
  studentId: string;
};

export function AdminStudentAccountDetails({ studentId }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentAccountProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolIdNumber, setSchoolIdNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [symptomsOrCondition, setSymptomsOrCondition] = useState("");
  const [address, setAddress] = useState("");
  const [birthdayEdited, setBirthdayEdited] = useState(false);
  const [genderEdited, setGenderEdited] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const applyProfileToForm = useCallback((p: StudentAccountProfileDetail) => {
    setLogin(p.studentId);
    setName(p.name);
    setEmail(p.email);
    setSchoolIdNumber(p.schoolIdNumber);
    setAddress(p.address ?? "");
    setContactNumber(p.contactNumber);
    setBirthday(p.birthday);
    setGender(p.gender);
    setSymptomsOrCondition(p.symptomsOrCondition);
    setBirthdayEdited(Boolean(p.birthdayEdited));
    setGenderEdited(Boolean(p.genderEdited));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveMessage(null);
    setProfile(null);
    try {
      const res = await fetch(
        `/api/admin/student-profile?studentId=${encodeURIComponent(studentId)}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to load profile.");
      const data = body.data as StudentAccountProfileDetail;
      setProfile(data);
      applyProfileToForm(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [studentId, applyProfileToForm]);

  useEffect(() => {
    load();
  }, [load]);

  function startEditing() {
    if (profile) applyProfileToForm(profile);
    setSaveError(null);
    setSaveMessage(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (profile) applyProfileToForm(profile);
    setSaveError(null);
    setSaveMessage(null);
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const payload: Record<string, unknown> = {
        studentId,
        name,
        email,
        schoolIdNumber,
        address,
        contactNumber,
        birthday,
        gender,
        symptomsOrCondition,
        birthdayEdited,
        genderEdited,
      };
      if (login.trim() !== studentId) {
        payload.newStudentId = login.trim();
      }

      const res = await fetch("/api/admin/student-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to save.");

      const data = body.data as StudentAccountProfileDetail;
      setProfile(data);
      applyProfileToForm(data);
      setSaveMessage("Account saved.");
      setEditing(false);

      if (data.studentId !== studentId) {
        router.replace(`/admin/patient-finder/${encodeURIComponent(data.studentId)}`);
        router.refresh();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleResetForm() {
    if (profile) applyProfileToForm(profile);
    setSaveError(null);
    setSaveMessage(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-muted-foreground sm:min-h-64">
        <Loader2 className="size-7 animate-spin" aria-hidden />
        <p className="text-sm font-medium text-foreground sm:text-base">Loading account…</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive sm:text-base">{error}</p>;
  }

  if (!profile) {
    return null;
  }

  const agePreview =
    birthday.trim() ? (() => {
      const birth = new Date(birthday);
      if (Number.isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      const d = today.getDate() - birth.getDate();
      if (m < 0 || (m === 0 && d < 0)) age -= 1;
      return age >= 0 ? age : null;
    })() : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Edit fields below, then save or cancel."
            : "View account information. Use Edit when you need to change the registry record."}
        </p>
        {!editing ? (
          <Button type="button" size="lg" variant="outline" onClick={startEditing}>
            <Pencil className="size-4" aria-hidden />
            Edit account
          </Button>
        ) : (
          <Button type="button" size="lg" variant="ghost" onClick={cancelEditing} disabled={saving}>
            Cancel editing
          </Button>
        )}
      </div>

      {saveMessage && !editing ? (
        <p className="text-sm font-medium text-green-700">{saveMessage}</p>
      ) : null}

      {editing ? (
        <form onSubmit={handleSave}>
          <div className={`${cardPad} w-full min-w-0 space-y-5 bg-neutral-50/80`}>
            <p className={sectionTitle}>Edit account</p>
            <p className="text-xs text-muted-foreground">
              BMI is still updated from the student BMI flow. Changing login does not move old BMI
              rows.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acct-login">Login (student ID)</Label>
                <Input
                  id="acct-login"
                  value={login}
                  onChange={(ev) => setLogin(ev.target.value)}
                  className="h-10 font-mono text-sm sm:h-11"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acct-name">Full name</Label>
                <Input
                  id="acct-name"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acct-email">Email</Label>
                <Input
                  id="acct-email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acct-school">School ID number</Label>
                <Input
                  id="acct-school"
                  value={schoolIdNumber}
                  onChange={(ev) => setSchoolIdNumber(ev.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acct-contact">Mobile / contact</Label>
                <Input
                  id="acct-contact"
                  value={contactNumber}
                  onChange={(ev) => setContactNumber(ev.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acct-address">Address</Label>
                <Input
                  id="acct-address"
                  value={address}
                  onChange={(ev) => setAddress(ev.target.value)}
                  className="h-10 sm:h-11"
                  placeholder="Street, city, region"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acct-birthday">Birthday</Label>
                <Input
                  id="acct-birthday"
                  type="date"
                  value={birthday.length >= 10 ? birthday.slice(0, 10) : birthday}
                  onChange={(ev) => setBirthday(ev.target.value)}
                  className="h-10 sm:h-11"
                />
                {agePreview != null ? (
                  <p className="text-xs text-muted-foreground">About {agePreview} years old</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acct-gender">Gender</Label>
                <Input
                  id="acct-gender"
                  value={gender}
                  onChange={(ev) => setGender(ev.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="acct-symptoms">Symptoms / condition (on file)</Label>
                <textarea
                  id="acct-symptoms"
                  value={symptomsOrCondition}
                  onChange={(ev) => setSymptomsOrCondition(ev.target.value)}
                  className={textareaClass}
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-8">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={birthdayEdited}
                    onChange={(ev) => setBirthdayEdited(ev.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  <span>Birthday marked as edited (student portal rule)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={genderEdited}
                    onChange={(ev) => setGenderEdited(ev.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  <span>Gender marked as edited (student portal rule)</span>
                </label>
              </div>
            </div>

            {saveError ? (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={saving}
                onClick={handleResetForm}
              >
                Reset form
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8">
          <div className={`${cardPad} w-full min-w-0 bg-neutral-50/80 lg:col-span-2`}>
            <p className={sectionTitle}>Account</p>
            <h2 className="mt-2 text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
              {profile.name}
            </h2>
            <dl className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 md:gap-8">
              <div className="sm:col-span-2">
                <dt className={dtClass}>Login (student ID)</dt>
                <dd className={`${ddClass} font-mono text-sm sm:text-base md:text-lg`}>
                  {profile.studentId}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={dtClass}>Email</dt>
                <dd className={`${ddClass} break-all`}>{profile.email || "—"}</dd>
              </div>
              <div>
                <dt className={dtClass}>School ID number</dt>
                <dd className={ddClass}>{profile.schoolIdNumber || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={dtClass}>Address</dt>
                <dd className={`${ddClass} leading-relaxed`}>{profile.address || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className={`${cardPad} w-full min-w-0`}>
            <p className={sectionTitle}>Personal information</p>
            <dl className="mt-6 grid gap-5 sm:mt-8 sm:gap-6">
              <div>
                <dt className={dtClass}>Mobile / contact</dt>
                <dd className={ddClass}>{profile.contactNumber || "—"}</dd>
              </div>
              <div>
                <dt className={dtClass}>Gender</dt>
                <dd className={ddClass}>{profile.gender || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={dtClass}>Birthday</dt>
                <dd className={ddClass}>
                  {profile.birthday || "—"}
                  {profile.age != null ? (
                    <span className="text-muted-foreground"> · {profile.age} years old</span>
                  ) : null}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={dtClass}>Symptoms / condition (on file)</dt>
                <dd className={`${ddClass} leading-relaxed`}>
                  {profile.symptomsOrCondition || "—"}
                </dd>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-sm">
                <span>Birthday edited flag: {profile.birthdayEdited ? "Yes" : "No"}</span>
                <span>Gender edited flag: {profile.genderEdited ? "Yes" : "No"}</span>
              </div>
            </dl>
          </div>
        </div>
      )}

      <div className={`${cardPad} w-full min-w-0 border-[#1d4ed8]/25 bg-[#1d4ed8]/6`}>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] sm:text-sm">
          Weight, height &amp; BMI
        </p>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Read-only here. Latest values come from the BMI tool for this login.
        </p>
        <dl className="mt-6 grid gap-6 sm:mt-8 sm:grid-cols-2 sm:gap-8">
          <div>
            <dt className={dtClass}>Weight</dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-foreground sm:text-2xl md:text-3xl">
              {profile.weightKg != null ? `${profile.weightKg} kg` : "Not on file"}
            </dd>
          </div>
          <div>
            <dt className={dtClass}>Height</dt>
            <dd className="mt-2 text-xl font-bold tabular-nums text-foreground sm:text-2xl md:text-3xl">
              {profile.heightCm != null ? (
                <>
                  {profile.heightCm} cm
                  {profile.heightM != null ? (
                    <span className="ml-2 block text-base font-normal text-muted-foreground sm:inline sm:text-lg">
                      ({profile.heightM} m)
                    </span>
                  ) : null}
                </>
              ) : profile.heightM != null ? (
                `${profile.heightM} m`
              ) : (
                "Not on file"
              )}
            </dd>
          </div>
          <div>
            <dt className={dtClass}>BMI</dt>
            <dd className="mt-2 text-lg font-semibold tabular-nums text-foreground sm:text-xl md:text-2xl">
              {profile.bmi != null ? profile.bmi.toFixed(1) : "—"}
              {profile.bmiCategory ? (
                <span className="ml-2 inline-block rounded-lg bg-white/90 px-3 py-1 text-sm font-medium text-foreground ring-1 ring-neutral-200 sm:text-base">
                  {profile.bmiCategory}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={dtClass}>Last recorded</dt>
            <dd className="mt-1 text-sm font-medium text-foreground sm:text-base">
              {formatRecordedAt(profile.bmiRecordedAt) ?? "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
