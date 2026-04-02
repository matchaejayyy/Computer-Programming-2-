"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ProfileData = {
  studentId: string;
  name: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
  contactNumber: string;
  email: string;
  schoolIdNumber: string;
  birthdayEdited: boolean;
  genderEdited: boolean;
  age: number | null;
  bmi?: number;
  bmiCategory?: "Underweight" | "Normal" | "Overweight";
  weightKg?: number;
  heightM?: number;
};

export function ProfilePatientDetails({ studentId }: { studentId: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [genderInput, setGenderInput] = useState("");
  const [birthdayInput, setBirthdayInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/profile?studentId=${encodeURIComponent(studentId)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Failed to load profile.");
      setData(body.data);
      setGenderInput(body.data.gender);
      setBirthdayInput(body.data.birthday);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  const canSaveGender = useMemo(
    () =>
      Boolean(data) &&
      !data?.genderEdited &&
      genderInput.trim().length > 0 &&
      genderInput.trim() !== data.gender &&
      !saving,
    [data, genderInput, saving]
  );

  const canSaveBirthday = useMemo(
    () =>
      Boolean(data) &&
      !data?.birthdayEdited &&
      birthdayInput.trim().length > 0 &&
      birthdayInput.trim() !== data.birthday &&
      !saving,
    [data, birthdayInput, saving]
  );

  async function saveChanges(payload: { gender?: string; birthday?: string }) {
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive">Unable to load profile details.</p>;
  }

  return (
    <div className="space-y-4 text-sm">
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Patient details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <DetailRow label="Name" value={data.name} />
          <DetailRow label="Age" value={data.age !== null ? String(data.age) : "N/A"} />
          <DetailRow label="Birthday" value={data.birthday} />
          <DetailRow label="Gender" value={data.gender} />
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {!data.genderEdited ? (
              <div className="space-y-2">
                <Label htmlFor="profile-gender">Edit gender (one time only)</Label>
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
                <Button
                  type="button"
                  onClick={() => saveChanges({ gender: genderInput.trim() })}
                  disabled={!canSaveGender}
                >
                  Save gender
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gender edit
                </p>
                <p className="text-foreground">Locked (already edited once)</p>
              </div>
            )}
            {!data.birthdayEdited ? (
              <div className="space-y-2">
                <Label htmlFor="profile-birthday">Edit birthday (one time only)</Label>
                <Input
                  id="profile-birthday"
                  type="date"
                  value={birthdayInput}
                  onChange={(event) => setBirthdayInput(event.target.value)}
                  disabled={saving}
                />
                <Button
                  type="button"
                  onClick={() => saveChanges({ birthday: birthdayInput.trim() })}
                  disabled={!canSaveBirthday}
                >
                  Save birthday
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Height and weight</CardTitle>
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
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Symptoms or condition</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-foreground">{data.symptomsOrCondition}</p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Personal contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <DetailRow label="Number" value={data.contactNumber} />
          <DetailRow label="Email" value={data.email} />
          <DetailRow label="School ID number" value={data.schoolIdNumber} />
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">BMI summary</CardTitle>
          {data.bmiCategory ? (
            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
              {data.bmiCategory}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <DetailRow
            label="BMI"
            value={typeof data.bmi === "number" ? data.bmi.toFixed(2) : "No data yet"}
          />
          <DetailRow label="Category" value={data.bmiCategory ?? "No data yet"} />
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
