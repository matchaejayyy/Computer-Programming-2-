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
  const [timeSlotsText, setTimeSlotsText] = useState("");
  const [blockedDatesText, setBlockedDatesText] = useState("");
  const [slotCapacity, setSlotCapacity] = useState(10);
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
          timeSlots?: string[];
          blockedDates?: string[];
          slotCapacity?: number;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Failed to load");
        }
        if (!cancelled && Array.isArray(data.rows)) {
          setRows(data.rows);
        }
        if (!cancelled) {
          setTimeSlotsText(
            Array.isArray(data.timeSlots) ? data.timeSlots.join("\n") : ""
          );
          setBlockedDatesText(
            Array.isArray(data.blockedDates) ? data.blockedDates.join("\n") : ""
          );
          setSlotCapacity(
            typeof data.slotCapacity === "number" && data.slotCapacity > 0
              ? Math.floor(data.slotCapacity)
              : 10
          );
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
      const timeSlots = timeSlotsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const blockedDates = blockedDatesText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
      const res = await fetch("/api/admin/clinic-weekly-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, timeSlots, blockedDates, slotCapacity }),
      });
      const data = (await res.json()) as {
        error?: string;
        rows?: WeeklyHourRow[];
        timeSlots?: string[];
        blockedDates?: string[];
        slotCapacity?: number;
      };
      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }
      if (Array.isArray(data.rows)) {
        setRows(data.rows);
      }
      if (Array.isArray(data.timeSlots)) {
        setTimeSlotsText(data.timeSlots.join("\n"));
      }
      if (Array.isArray(data.blockedDates)) {
        setBlockedDatesText(data.blockedDates.join("\n"));
      }
      if (typeof data.slotCapacity === "number" && data.slotCapacity > 0) {
        setSlotCapacity(Math.floor(data.slotCapacity));
      }
      setMessage(
        "Saved. Weekly hours appear on View clinic schedule; time slots and blocked dates apply to Reserve appointment."
      );
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
            Weekly hours, appointment time slots, and blocked dates. Saving updates the database and{" "}
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
                  {saving ? "Saving…" : "Save schedule & slots"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4 min-w-0 border border-border shadow-sm">
        <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
          <CardTitle className="text-lg font-bold text-foreground">Reserve appointment — time slots</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            One slot per line (e.g. <code className="text-xs">9:00 AM</code>). Shown on the student
            Reserve appointment form.
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <div className="mb-4 max-w-sm space-y-2">
            <Label htmlFor="slot-capacity">Per-time-slot capacity</Label>
            <Input
              id="slot-capacity"
              type="number"
              min={1}
              step={1}
              value={slotCapacity}
              onChange={(e) => setSlotCapacity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <p className="text-xs text-muted-foreground">
              Maximum students per time slot. Full slots will be marked unavailable.
            </p>
          </div>
          <textarea
            className="min-h-[160px] w-full rounded-lg border border-input bg-white px-3 py-2 font-mono text-sm"
            value={timeSlotsText}
            onChange={(e) => setTimeSlotsText(e.target.value)}
            disabled={loading}
            placeholder={"8:00 AM\n9:00 AM\n..."}
          />
        </CardContent>
      </Card>

      <Card className="mb-4 min-w-0 border border-border shadow-sm">
        <CardHeader className="border-b border-border px-4 py-4 sm:px-5">
          <CardTitle className="text-lg font-bold text-foreground">Blocked dates (unavailable)</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            One <code className="text-xs">YYYY-MM-DD</code> per line. Students cannot pick these
            dates when reserving.
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-input bg-white px-3 py-2 font-mono text-sm"
            value={blockedDatesText}
            onChange={(e) => setBlockedDatesText(e.target.value)}
            disabled={loading}
            placeholder={"2026-04-18\n2026-05-01"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
