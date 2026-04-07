"use client";

import { useEffect, useMemo, useState } from "react";

import { useClinicStudentId } from "@/components/clinic/clinic-student-bridge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type BmiCategory = "Underweight" | "Normal" | "Overweight";

type BmiData = {
  bmi?: number;
  category?: BmiCategory;
  weightKg?: number;
  heightM?: number;
  updatedAt?: number;
  remainingAttempts: number;
  resetAt?: number;
  message?: string;
};

export function ProfileBmi({ studentId: studentIdProp }: { studentId?: string }) {
  const fromContext = useClinicStudentId();
  const studentId = studentIdProp ?? fromContext;
  const [weightKg, setWeightKg] = useState("");
  const [height, setHeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [bmiData, setBmiData] = useState<BmiData | null>(null);
  const [calculated, setCalculated] = useState<{
    bmi: number;
    category: BmiCategory;
    weightKg: number;
    heightM: number;
  } | null>(null);

  async function loadBmi() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bmi?studentId=${encodeURIComponent(studentId)}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Failed to fetch BMI.");
      }
      setBmiData(body.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch BMI.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setBmiData(null);
      return;
    }
    loadBmi();
  }, [studentId]);

  const canSubmit = useMemo(
    () => Number(weightKg) > 0 && Number(height) > 0 && !saving,
    [weightKg, height, saving]
  );

  function normalizeHeightToMeters(input: number): number {
    return input > 3 ? input / 100 : input;
  }

  function categoryFromBmi(bmi: number): BmiCategory {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    return "Overweight";
  }

  function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedWeight = Number(weightKg);
    const parsedHeight = Number(height);
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || Number.isNaN(parsedHeight) || parsedHeight <= 0) {
      setError("Weight and height must be positive numbers.");
      return;
    }
    const heightM = normalizeHeightToMeters(parsedHeight);
    const bmi = parsedWeight / (heightM * heightM);
    setCalculated({
      bmi: Number(bmi.toFixed(2)),
      category: categoryFromBmi(bmi),
      weightKg: parsedWeight,
      heightM: Number(heightM.toFixed(2)),
    });
    setError(null);
    setMessage("BMI calculated. Save to profile to keep it.");
  }

  async function handleSaveToProfile() {
    if (!calculated) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/bmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          weightKg: calculated.weightKg,
          height: calculated.heightM,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Saving BMI to profile failed.");
      }
      setBmiData(body.data);
      setMessage("Saved to profile.");
      setCalculated(null);
      setWeightKg("");
      setHeight("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Saving BMI failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!studentId) {
    return (
      <p className="text-sm text-muted-foreground pt-2">
        Sign in as a student to use the BMI checker.
      </p>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {loading ? <p className="text-sm text-muted-foreground">Loading BMI data...</p> : null}

      {bmiData?.bmi ? (
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border pb-3">
            <CardTitle className="text-base text-foreground">Current BMI</CardTitle>
            {bmiData.category ? (
              <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
                {bmiData.category}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm">
            <DetailRow label="BMI" value={bmiData.bmi.toFixed(2)} />
            <DetailRow label="Category" value={bmiData.category ?? "No data"} />
            <Separator />
            <DetailRow
              label="Update access"
              value="Unlimited"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base text-foreground">Calculate BMI</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCalculate}>
            <div className="space-y-2">
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input
                id="weightKg"
                type="number"
                min="1"
                step="0.1"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                placeholder="e.g. 60"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm or m)</Label>
              <Input
                id="height"
                type="number"
                min="0.5"
                step="0.01"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                placeholder="e.g. 165 or 1.65"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!canSubmit || saving}>
                  Calculate BMI
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!calculated || saving}
                  onClick={() => void handleSaveToProfile()}
                >
                  {saving ? "Saving..." : "Save to profile"}
                </Button>
              </div>
            </div>
          </form>
          {calculated ? (
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">
                BMI: {calculated.bmi.toFixed(2)} ({calculated.category})
              </p>
              <p className="text-muted-foreground">
                Weight: {calculated.weightKg.toFixed(2)} kg | Height: {calculated.heightM.toFixed(2)} m
              </p>
            </div>
          ) : null}
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
