"use client";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Ban, Clock } from "lucide-react";

import { HomeLink } from "@/components/admin/dashboard/HomeLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DateOverride = { date: string; available: boolean };
type SlotAvailability = {
  date: string;
  blocked: boolean;
  allFull: boolean;
  slotCapacity: number;
  slots: Array<{ time: string; booked: number; capacity: number; full: boolean; disabled: boolean }>;
};

function isWeekend(dateIso: string): boolean {
  if (!dateIso) return false;
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
}

export default function SchedulePage() {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [disabledSlotsByDate, setDisabledSlotsByDate] = useState<Record<string, string[]>>({});
  const [slotCapacityByDateTime, setSlotCapacityByDateTime] = useState<Record<string, Record<string, number>>>({});
  const [slotCapacity, setSlotCapacity] = useState(5);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCapacity, setSelectedCapacity] = useState(5);
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = async () => {
    const res = await fetch("/api/admin/clinic-weekly-schedule", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load schedule.");
    setTimeSlots(Array.isArray(data.timeSlots) ? data.timeSlots : []);
    setBlockedDates(Array.isArray(data.blockedDates) ? data.blockedDates : []);
    setDateOverrides(Array.isArray(data.dateOverrides) ? data.dateOverrides : []);
    setDisabledSlotsByDate(
      data.disabledSlotsByDate && typeof data.disabledSlotsByDate === "object"
        ? data.disabledSlotsByDate
        : {}
    );
    setSlotCapacityByDateTime(
      data.slotCapacityByDateTime && typeof data.slotCapacityByDateTime === "object"
        ? data.slotCapacityByDateTime
        : {}
    );
    const nextCap =
      typeof data.slotCapacity === "number" && data.slotCapacity > 0
        ? Math.floor(data.slotCapacity)
        : 5;
    setSlotCapacity(nextCap);
    setSelectedCapacity(nextCap);
  };

  const loadAvailabilityForDate = async (date: string) => {
    if (!date) {
      setAvailability(null);
      return;
    }
    const res = await fetch(`/api/clinic-slot-availability?date=${encodeURIComponent(date)}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as SlotAvailability & { error?: string };
    if (!res.ok) throw new Error(data.error || "Failed to load day bookings.");
    setAvailability(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadSchedule();
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clinic-slot-availability?date=${encodeURIComponent(selectedDate)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as SlotAvailability & { error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load day bookings.");
        if (!cancelled) setAvailability(data);
      } catch {
        if (!cancelled) setAvailability(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, saving]);

  const totalDisabledSlots = useMemo(
    () => Object.values(disabledSlotsByDate).reduce((sum, items) => sum + items.length, 0),
    [disabledSlotsByDate]
  );
  const hasDateSelected = Boolean(selectedDate);
  const hasTimeSelected = Boolean(selectedTime);
  const selectedDateDisabledSlots = selectedDate ? disabledSlotsByDate[selectedDate] ?? [] : [];
  const selectedSlotIsDisabled =
    selectedDate && selectedTime ? selectedDateDisabledSlots.includes(selectedTime) : false;
  const selectedDateOverride = selectedDate
    ? dateOverrides.find((entry) => entry.date === selectedDate)
    : undefined;
  const selectedDateIsUnavailable = selectedDate
    ? blockedDates.includes(selectedDate) ||
      (selectedDateOverride
        ? !selectedDateOverride.available
        : isWeekend(selectedDate))
    : false;
  const selectedDateIsAvailable = hasDateSelected && !selectedDateIsUnavailable;

  const save = async () => {
    let nextSlotCapacityByDateTime = slotCapacityByDateTime;
    if (selectedDate && selectedTime && selectedCapacity >= 1) {
      nextSlotCapacityByDateTime = {
        ...slotCapacityByDateTime,
        [selectedDate]: {
          ...(slotCapacityByDateTime[selectedDate] ?? {}),
          [selectedTime]: Math.floor(selectedCapacity),
        },
      };
      setSlotCapacityByDateTime(nextSlotCapacityByDateTime);
    }
    return saveWithPayload({
      timeSlots,
      blockedDates,
      dateOverrides,
      disabledSlotsByDate,
      slotCapacity,
      slotCapacityByDateTime: nextSlotCapacityByDateTime,
    });
  };

  const saveWithPayload = async (payload: {
    timeSlots: string[];
    blockedDates: string[];
    dateOverrides: DateOverride[];
    disabledSlotsByDate: Record<string, string[]>;
    slotCapacity: number;
    slotCapacityByDateTime: Record<string, Record<string, number>>;
  }) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/clinic-weekly-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      await loadSchedule();
      await loadAvailabilityForDate(selectedDate);
      setMessage("Schedule rules saved and applied to student reservation.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const upsertOverride = (available: boolean) => {
    if (!selectedDate) return;
    const nextDateOverrides = [
      ...dateOverrides.filter((entry) => entry.date !== selectedDate),
      { date: selectedDate, available },
    ];
    const nextBlockedDates = !available
      ? blockedDates.includes(selectedDate)
        ? blockedDates
        : [...blockedDates, selectedDate]
      : blockedDates.filter((d) => d !== selectedDate);
    setDateOverrides(nextDateOverrides);
    setBlockedDates(nextBlockedDates);
    setMessage("Changes pending. Click Save to apply.");
  };

  const toggleSlotDisabled = () => {
    if (!selectedDate || !selectedTime) return;
    const current = disabledSlotsByDate[selectedDate] ?? [];
    const exists = current.includes(selectedTime);
    const nextDisabledSlotsByDate = {
      ...disabledSlotsByDate,
      [selectedDate]: exists ? current.filter((s) => s !== selectedTime) : [...current, selectedTime],
    };
    setDisabledSlotsByDate(nextDisabledSlotsByDate);
    setMessage("Changes pending. Click Save to apply.");
  };

  const setDefaultCap = () => {
    if (selectedCapacity < 1) return;
    const nextSlotCapacity = Math.floor(selectedCapacity);
    setSlotCapacity(nextSlotCapacity);
    // Reset per-slot overrides so the new default applies everywhere.
    setSlotCapacityByDateTime({});
    setMessage("Changes pending. Click Save to apply.");
  };

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 text-gray-900">
      <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Schedule</h1>
        <p className="mt-1 text-sm text-gray-600">
          Step 1: choose date and time. Step 2: click an action, then save.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Step 1 — Select Date and Time</CardTitle>
            <p className="text-sm text-muted-foreground">
              These fields control which actions are available.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-xs">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-1.5 block text-xs">Time Slot</Label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select time slot</option>
                  {timeSlots.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Current selection:</span> Date{" "}
              <span className="font-semibold text-foreground">{selectedDate || "not selected"}</span>,
              Time <span className="font-semibold text-foreground">{selectedTime || "not selected"}</span>
            </div>
          {selectedDate ? (
            <div
              className={
                selectedDateIsUnavailable
                  ? "rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700"
                  : "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              }
            >
              {selectedDateIsUnavailable
                ? `Date status: ${selectedDate} is currently unavailable.`
                : `Date status: ${selectedDate} is currently available.`}
            </div>
          ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Calendar className="h-4 w-4 text-green-600" />
              <p className="text-sm">
                Overrides: <span className="font-semibold">{dateOverrides.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Ban className="h-4 w-4 text-orange-600" />
              <p className="text-sm">
                Blocked dates: <span className="font-semibold">{blockedDates.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <Clock className="h-4 w-4 text-red-600" />
              <p className="text-sm">
                Disabled slots: <span className="font-semibold">{totalDisabledSlots}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step 2 — Choose Action</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actions update draft changes only. Click Save to apply.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Button
              onClick={() => upsertOverride(false)}
              disabled={!hasDateSelected || selectedDateIsUnavailable}
              variant="outline"
              className="justify-start border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              Set selected date as unavailable
            </Button>
            <Button
              onClick={() => upsertOverride(true)}
              disabled={!hasDateSelected || selectedDateIsAvailable}
              variant="outline"
              className="justify-start border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              Set selected date as available
            </Button>
            <Button
              onClick={toggleSlotDisabled}
              disabled={!hasDateSelected || !hasTimeSelected}
              variant="outline"
              className="justify-start"
            >
              {selectedSlotIsDisabled ? "Enable selected time slot" : "Disable selected time slot"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <Label className="mb-1.5 block text-xs">Capacity value</Label>
              <Input
                type="number"
                min={1}
                value={selectedCapacity}
                onChange={(e) => setSelectedCapacity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default capacity now: <span className="font-semibold text-foreground">{slotCapacity}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Save also applies this value to the selected date + time.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={setDefaultCap}
                variant="outline"
                className="justify-start border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Apply capacity as default for all slots
              </Button>
              <Button onClick={() => void save()} disabled={loading || saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Live Status for Selected Date</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">Select a date above to view bookings.</p>
          ) : !availability ? (
            <p className="text-sm text-muted-foreground">Loading availability...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                {availability.blocked
                  ? "This date is currently blocked."
                  : availability.allFull
                    ? "All available slots are full."
                    : "Some slots are still available."}
              </p>
              {availability.slots.map((slot) => (
                <div
                  key={slot.time}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{slot.time}</span>
                  <span className="text-muted-foreground">
                    {slot.disabled ? "Unavailable" : `${slot.booked}/${slot.capacity}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blocked Dates List</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked dates.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...blockedDates].sort().map((date) => (
                <span
                  key={date}
                  className={date === selectedDate ? "rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800" : "rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground"}
                >
                  {date}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-gray-500">Loading schedule settings...</p> : null}
    </div>
  );
}
