"use client";

import { useEffect, useState } from "react";

import { HomeLink } from "@/components/admin/admin-homelink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeeklyHourRow } from "@/lib/clinic/clinic-weekly-hours-store";

export default function EditClinicSchedulePage() {
  const [rows, setRows] = useState<WeeklyHourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/clinic-weekly-schedule");
        const data = (await res.json()) as {
          rows?: WeeklyHourRow[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Failed to load");
        }
        if (!cancelled && Array.isArray(data.rows)) {
          setRows(data.rows);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRow(i: number, field: keyof WeeklyHourRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[i], [field]: value };
      next[i] = row;
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { label: "New day", hours: "8:00 AM – 4:00 PM" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, j) => j !== i));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/clinic-weekly-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as {
        error?: string;
        rows?: WeeklyHourRow[];
      };
      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }
      if (Array.isArray(data.rows)) {
        setRows(data.rows);
      }
      setMessage("Saved. Weekly hours were updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Edit clinic schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weekly clinic hours only. Reserve-appointment slot rules and blocked dates are managed in{" "}
            <code className="text-xs text-foreground">Manage Schedule</code>. Saving updates the database and{" "}
            <code className="text-xs text-foreground">clinic_weekly_hours.json</code> (C++ tool when
            built).
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      <Card className="mb-4 min-w-0 border border-border shadow-sm">
        <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
          <CardTitle className="text-lg font-bold text-foreground">Weekly rows</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            Each row appears as one block on the student schedule page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-5">
          {loading ? (
            <div className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Loading</p>
              <p>Fetching schedule…</p>
            </div>
          ) : (
            <>
              {rows.map((row, i) => (
                <div
                  key={`${i}-${row.label}`}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={`schedule-label-${i}`} className="text-sm font-medium">
                      Label
                    </Label>
                    <Input
                      id={`schedule-label-${i}`}
                      value={row.label}
                      onChange={(e) => updateRow(i, "label", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={`schedule-hours-${i}`} className="text-sm font-medium">
                      Hours
                    </Label>
                    <Input
                      id={`schedule-hours-${i}`}
                      value={row.hours}
                      onChange={(e) => updateRow(i, "hours", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="shrink-0 sm:self-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-10 sm:w-auto"
                      onClick={() => removeRow(i)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 w-full sm:w-auto"
                  onClick={addRow}
                >
                  Add row
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="min-h-10 w-full sm:w-auto"
                  disabled={saving || rows.length === 0}
                  onClick={() => void save()}
                >
                  {saving ? "Saving…" : "Save weekly hours"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
