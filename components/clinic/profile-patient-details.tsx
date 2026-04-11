"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { useClinicStudentId } from "@/components/clinic/clinic-student-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  PROFILE_PLACEHOLDER,
  isBirthdayUnset,
  isProfileFieldUnset,
} from "@/lib/clinic/profile-placeholders";

type ProfileData = {
  studentId: string;
  name: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
  contactNumber: string;
  email: string;
  schoolIdNumber: string;
  address: string;
  birthdayEdited: boolean;
  genderEdited: boolean;
  age: number | null;
  needsInitialPasswordSetup?: boolean;
  bmi?: number;
  bmiCategory?: "Underweight" | "Normal" | "Overweight";
  weightKg?: number;
  heightM?: number;
};

function displayField(value: string): string {
  const t = value.trim();
  if (t === "" || t === PROFILE_PLACEHOLDER) return PROFILE_PLACEHOLDER;
  return value;
}

function normalizeProfileInput(value: string): string {
  return isProfileFieldUnset(value) ? "" : value.trim();
}

type ProfilePatientDetailsProps = {
  studentId?: string;
  editingEnabled?: boolean;
  onEditingEnabledChange?: (enabled: boolean) => void;
};

export function ProfilePatientDetails({
  studentId: studentIdProp,
  editingEnabled: editingEnabledProp,
  onEditingEnabledChange,
}: ProfilePatientDetailsProps) {
  const fromContext = useClinicStudentId();
  const studentId = studentIdProp ?? fromContext;
  const [data, setData] = useState<ProfileData | null>(null);
  const [genderInput, setGenderInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [schoolInput, setSchoolInput] = useState("");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [internalEditingEnabled, setInternalEditingEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const editingEnabled = editingEnabledProp ?? internalEditingEnabled;
  const setupMode = Boolean(data?.needsInitialPasswordSetup);
  const setEditingEnabled = (next: boolean) => {
    if (editingEnabledProp !== undefined && onEditingEnabledChange) {
      onEditingEnabledChange(next);
      return;
    }
    setInternalEditingEnabled(next);
  };

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/profile?studentId=${encodeURIComponent(studentId)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Failed to load profile.");
      const d = body.data as ProfileData;
      setData(d);
      setGenderInput(isProfileFieldUnset(d.gender) ? "" : d.gender);
      setBirthdayInput(isBirthdayUnset(d.birthday) ? "" : d.birthday.slice(0, 10));
      setAddressInput(isProfileFieldUnset(d.address) ? "" : d.address);
      setContactInput(isProfileFieldUnset(d.contactNumber) ? "" : d.contactNumber);
      setSchoolInput(isProfileFieldUnset(d.schoolIdNumber) ? "" : d.schoolIdNumber);
      setSymptomsInput(
        isProfileFieldUnset(d.symptomsOrCondition) ? "" : d.symptomsOrCondition
      );
      setEditingEnabled(false);
      setCurrentPasswordVerified(false);
      setShowResetPasswordForm(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setData(null);
      return;
    }
    loadProfile();
  }, [studentId]);

  const canEditGender = useMemo(() => {
    if (!data || saving) return false;
    return isProfileFieldUnset(data.gender);
  }, [data, saving]);

  const canEditBirthday = useMemo(() => {
    if (!data || saving) return false;
    return isBirthdayUnset(data.birthday);
  }, [data, saving]);

  const canEditAddress = useMemo(() => {
    if (!data || saving) return false;
    return editingEnabled || setupMode;
  }, [data, editingEnabled, saving, setupMode]);

  const canEditContact = useMemo(() => {
    if (!data || saving) return false;
    return editingEnabled || setupMode;
  }, [data, editingEnabled, saving, setupMode]);

  const canEditSchool = useMemo(() => {
    if (!data || saving) return false;
    return isProfileFieldUnset(data.schoolIdNumber);
  }, [data, saving]);

  const canEditSymptoms = useMemo(() => {
    if (!data || saving) return false;
    return isProfileFieldUnset(data.symptomsOrCondition);
  }, [data, saving]);

  async function saveChanges(payload: Record<string, string>): Promise<boolean> {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...payload }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Failed to save.");
      setMessage("Profile updated.");
      await loadProfile();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  const canSaveAllDetails = useMemo(() => {
    if (saving || !data) return false;

    const hasBirthdayChange =
      canEditBirthday && birthdayInput.trim() !== (isBirthdayUnset(data.birthday) ? "" : data.birthday.slice(0, 10));
    const hasSchoolChange = canEditSchool && schoolInput.trim() !== normalizeProfileInput(data.schoolIdNumber);
    const hasGenderChange = canEditGender && genderInput.trim() !== normalizeProfileInput(data.gender);
    const hasContactChange = canEditContact && contactInput.trim() !== normalizeProfileInput(data.contactNumber);
    const hasAddressChange = canEditAddress && addressInput.trim() !== normalizeProfileInput(data.address);
    const hasSymptomsChange =
      canEditSymptoms && symptomsInput.trim() !== normalizeProfileInput(data.symptomsOrCondition);

    const hasAnyChange =
      hasBirthdayChange ||
      hasSchoolChange ||
      hasGenderChange ||
      hasContactChange ||
      hasAddressChange ||
      hasSymptomsChange;
    if (!hasAnyChange) return false;

    if (canEditBirthday && birthdayInput.trim().length < 8) return false;
    if (setupMode && genderInput.trim() === "") return false;
    if (canEditSchool && !schoolInput.trim()) return false;
    if (setupMode && !addressInput.trim()) return false;
    return true;
  }, [
    addressInput,
    birthdayInput,
    canEditAddress,
    canEditBirthday,
    canEditContact,
    canEditGender,
    canEditSchool,
    canEditSymptoms,
    contactInput,
    data,
    genderInput,
    saving,
    schoolInput,
    setupMode,
    symptomsInput,
  ]);

  async function saveAllDetails(): Promise<boolean> {
    const payload: Record<string, string> = {};

    if (canEditBirthday) {
      const birthday = birthdayInput.trim();
      if (!birthday) {
        setError("Birthday is required.");
        return false;
      }
      payload.birthday = birthday;
    }

    if (canEditSchool) {
      const schoolIdNumber = schoolInput.trim();
      if (!schoolIdNumber) {
        setError("School ID number is required.");
        return false;
      }
      payload.schoolIdNumber = schoolIdNumber;
    }

    if (canEditGender) {
      if (setupMode && (genderInput !== "Male" && genderInput !== "Female")) {
        setError("Gender is required.");
        return false;
      }
      if (genderInput === "Male" || genderInput === "Female") {
        payload.gender = genderInput;
      }
    }
    if (canEditContact) {
      payload.contactNumber = contactInput.trim();
    }
    if (canEditAddress) {
      if (setupMode && !addressInput.trim()) {
        setError("Address is required.");
        return false;
      }
      payload.address = addressInput.trim();
    }
    if (canEditSymptoms && symptomsInput.trim()) {
      payload.symptomsOrCondition = symptomsInput.trim();
    }

    let profileSaved = true;
    if (Object.keys(payload).length > 0) {
      profileSaved = await saveChanges(payload);
      if (!profileSaved) return false;
    }

    if (Object.keys(payload).length === 0 && !editingEnabled) {
      setError(null);
      return true;
    }

    setEditingEnabled(false);
    return profileSaved;
  }

  const needsCreatePasswordOnly = Boolean(data?.needsInitialPasswordSetup);
  const profileSetupComplete = useMemo(() => {
    if (!data) return false;
    const birthdayDone = !isBirthdayUnset(data.birthday);
    const genderDone = !isProfileFieldUnset(data.gender);
    const schoolIdDone = !isProfileFieldUnset(data.schoolIdNumber);
    const addressDone = !isProfileFieldUnset(data.address);
    return birthdayDone && genderDone && schoolIdDone && addressDone;
  }, [data]);
  const showCreatePasswordNow = needsCreatePasswordOnly && profileSetupComplete;

  async function verifyCurrentPasswordFirst(): Promise<boolean> {
    setPasswordError(null);
    setPasswordMessage(null);
    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return false;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, verifyOnly: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to verify current password.");
      setCurrentPasswordVerified(true);
      setPasswordMessage("Current password verified. You can set a new password now.");
      return true;
    } catch (err) {
      setCurrentPasswordVerified(false);
      setPasswordError(err instanceof Error ? err.message : "Wrong password.");
      return false;
    } finally {
      setPasswordSaving(false);
    }
  }

  async function submitPasswordChange(): Promise<boolean> {
    setPasswordError(null);
    setPasswordMessage(null);
    const hasAnyPasswordInput =
      currentPassword.trim().length > 0 ||
      newPassword.trim().length > 0 ||
      confirmPassword.trim().length > 0;

    if (!needsCreatePasswordOnly && !currentPasswordVerified && !hasAnyPasswordInput) {
      return true;
    }

    if (!needsCreatePasswordOnly && !currentPasswordVerified) {
      setPasswordError("Please confirm your current password first.");
      return false;
    }

    if (needsCreatePasswordOnly && (!newPassword.trim() || !confirmPassword.trim())) {
      setPasswordError("New password and confirmation are required.");
      return false;
    }

    if (!needsCreatePasswordOnly) {
      if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setPasswordError("Current, new, and confirm password are required.");
        return false;
      }
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordSaving(true);
    try {
      const payload = needsCreatePasswordOnly
        ? { newPassword, confirmPassword }
        : { currentPassword, newPassword, confirmPassword };
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to change password.");
      setPasswordMessage(needsCreatePasswordOnly ? "Password created." : "Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordVerified(false);
      if (needsCreatePasswordOnly) {
        window.location.href = "/";
        return true;
      }
      await loadProfile();
      return true;
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed.");
      return false;
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!studentId) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as a student to view your profile.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive">Unable to load profile details.</p>;
  }

  const passwordCard = (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base text-foreground">
          {needsCreatePasswordOnly ? "Create password" : "Reset password"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="max-w-md space-y-3">
          {needsCreatePasswordOnly && !showCreatePasswordNow ? (
            <p className="text-xs text-muted-foreground">
              Finish and save your required profile details first. Create password becomes available as the final step.
            </p>
          ) : null}
          {showCreatePasswordNow ? (
            <p className="text-xs text-muted-foreground">
              Set your account password now to finish first-time setup.
            </p>
          ) : null}
          {!needsCreatePasswordOnly && !showResetPasswordForm ? (
            <Button
              type="button"
              onClick={() => {
                setShowResetPasswordForm(true);
                setPasswordError(null);
                setPasswordMessage(null);
              }}
            >
              Reset password
            </Button>
          ) : null}
          {!needsCreatePasswordOnly && showResetPasswordForm && !currentPasswordVerified ? (
            <div className="space-y-2">
              <Label htmlFor="pw-current">Current password</Label>
              <div className="relative">
                <Input
                  id="pw-current"
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordSaving}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void verifyCurrentPasswordFirst()}
                disabled={passwordSaving}
              >
                Confirm current password
              </Button>
            </div>
          ) : null}
          {!needsCreatePasswordOnly && showResetPasswordForm && currentPasswordVerified ? (
            <p className="text-xs text-green-700">Current password confirmed.</p>
          ) : null}
          {showCreatePasswordNow || (showResetPasswordForm && currentPasswordVerified) ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pw-new">
                  {showCreatePasswordNow
                    ? "Create password (min. 8 characters)"
                    : "Set new password (min. 8 characters)"}
                </Label>
                <div className="relative">
                  <Input
                    id="pw-new"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordSaving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="pw-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordSaving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
              </div>
            </>
          ) : null}
          {showCreatePasswordNow || showResetPasswordForm ? (
            <Button type="button" onClick={() => void submitPasswordChange()} disabled={passwordSaving}>
              {passwordSaving ? "Saving..." : showCreatePasswordNow ? "Create password" : "Save new password"}
            </Button>
          ) : null}
          {passwordMessage ? (
            <p className="text-sm text-green-700">{passwordMessage}</p>
          ) : null}
          {passwordError ? (
            <p className="text-sm text-destructive">{passwordError}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 text-sm">
      {needsCreatePasswordOnly ? passwordCard : null}

      {showCreatePasswordNow ? null : (
        <>
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Student details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <DetailRow label="Name" value={data.name} />
          <DetailRow
            label="Age"
            value={data.age !== null ? String(data.age) : "—"}
          />
          <DetailRow label="Birthday" value={displayField(data.birthday)} />
          <DetailRow label="Gender" value={displayField(data.gender)} />
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {canEditGender ? (
              <div className="space-y-2">
                <Label htmlFor="profile-gender">Set gender (once)</Label>
                <select
                  id="profile-gender"
                  value={genderInput}
                  onChange={(event) => setGenderInput(event.target.value)}
                  disabled={saving}
                  className="h-10 w-full rounded-lg border border-input bg-white px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Gender
                </p>
                <p className="text-muted-foreground">
                  Set by clinic records. Contact staff to change.
                </p>
              </div>
            )}
            {canEditBirthday ? (
              <div className="space-y-2">
                <Label htmlFor="profile-birthday">Set birthday (once)</Label>
                <Input
                  id="profile-birthday"
                  type="date"
                  value={birthdayInput}
                  onChange={(event) => setBirthdayInput(event.target.value)}
                  disabled={saving}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Birthday
                </p>
                <p className="text-muted-foreground">
                  Set by clinic records. Contact staff to change.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Weight, height, and BMI</CardTitle>
          {data.bmiCategory ? (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
              {data.bmiCategory}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <DetailRow
            label="Weight"
            value={data.weightKg ? `${data.weightKg.toFixed(2)} kg` : "No data yet"}
          />
          <DetailRow
            label="Height"
            value={data.heightM ? `${data.heightM.toFixed(2)} m` : "No data yet"}
          />
          <DetailRow
            label="BMI"
            value={typeof data.bmi === "number" ? data.bmi.toFixed(2) : "No data yet"}
          />
          <DetailRow label="BMI Category" value={data.bmiCategory ?? "No data yet"} />
          <p className="text-xs text-muted-foreground">
            To update BMI values, use the BMI Checker page then press Save to profile.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Symptoms or condition</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {canEditSymptoms ? (
            <div className="space-y-2">
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                disabled={saving}
                placeholder="Describe symptoms or type &quot;None&quot; if applicable"
              />
            </div>
          ) : (
            <p className="text-foreground">{data.symptomsOrCondition}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Personal contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {canEditContact ? (
            <div className="space-y-2">
              <Label htmlFor="profile-contact">Mobile / contact number</Label>
              <Input
                id="profile-contact"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                disabled={saving}
                placeholder="09XXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                Optional. You can leave this blank.
              </p>
            </div>
          ) : (
            <DetailRow label="Number" value={data.contactNumber} />
          )}
          <DetailRow label="Email" value={data.email} />
          {canEditSchool ? (
            <div className="space-y-2">
              <Label htmlFor="profile-school">School ID number</Label>
              <Input
                id="profile-school"
                value={schoolInput}
                onChange={(e) => setSchoolInput(e.target.value)}
                disabled={saving}
                placeholder="e.g. 2024-12345"
              />
            </div>
          ) : (
            <DetailRow label="School ID number" value={displayField(data.schoolIdNumber)} />
          )}
          {canEditAddress ? (
            <div className="space-y-2 pt-2">
              <Label htmlFor="profile-address">Address</Label>
              <Input
                id="profile-address"
                value={addressInput}
                onChange={(event) => setAddressInput(event.target.value)}
                placeholder="Street, Barangay, City"
                disabled={saving}
              />
            </div>
          ) : (
            <DetailRow label="Address" value={data.address} />
          )}
          {editingEnabled || setupMode ? (
            <Button type="button" onClick={() => void saveAllDetails()} disabled={!canSaveAllDetails}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
        </>
      )}
      {!needsCreatePasswordOnly ? passwordCard : null}

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
