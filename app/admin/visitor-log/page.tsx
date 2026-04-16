"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { HomeLink } from "@/components/admin/dashboard/HomeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function currentTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function VisitorLogPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoTime, setAutoTime] = useState(currentTimeLabel());
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    course: "",
    year: "",
    purpose: "",
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setAutoTime(currentTimeLabel());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const yearOptions =
    form.department === "SHS"
      ? ["Grade 11", "Grade 12"]
      : ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const timeNow = currentTimeLabel();
    try {
      const response = await fetch("/api/admin/visitor-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          time: timeNow,
          createdAt: new Date().toISOString(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save visitor log.");
      }

      setForm({
        name: "",
        email: "",
        department: "",
        course: "",
        year: "",
        purpose: "",
      });
      setSuccess("Visitor log saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save visitor log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Visitor Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add walk-in visitor details. Saved entries appear in Clinic Visit History.
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ClipboardList className="size-4" />
            Visitor Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="visitor-name">Name</Label>
              <Input
                id="visitor-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-email">Email</Label>
              <Input
                id="visitor-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-department">Department</Label>
              <select
                id="visitor-department"
                value={form.department}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                    year: "",
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select department</option>
                <option value="SHS">SHS</option>
                <option value="CLASE">CLASE</option>
                <option value="TECHNO">TECHNO</option>
                <option value="CNND">CNND</option>
                <option value="CPMT">CPMT</option>
                <option value="COB">COB</option>
                <option value="COJ">COJ</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-course">Course</Label>
              <Input
                id="visitor-course"
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-year">Year</Label>
              <select
                id="visitor-year"
                value={form.year}
                onChange={(e) => updateField("year", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={!form.department}
                required
              >
                <option value="">
                  {form.department ? "Select year level" : "Select department first"}
                </option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitor-time">Time (automatic)</Label>
              <Input id="visitor-time" value={autoTime} readOnly />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="visitor-purpose">Purpose</Label>
              <Input
                id="visitor-purpose"
                value={form.purpose}
                onChange={(e) => updateField("purpose", e.target.value)}
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
            {success ? <p className="text-sm text-green-700 md:col-span-2">{success}</p> : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Visitor Log"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
