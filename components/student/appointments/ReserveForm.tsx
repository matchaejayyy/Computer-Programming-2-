"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNotifyAppointmentsChanged } from "@/components/common/ClinicStudentBridge";
import { FormField } from "@/components/forms/FormField";
import { isDateAvailableForSchedule } from "@/lib/repositories/schedule/schedule-date-availability";
import { cn } from "@/lib/utils";

const reasonOptions = [
  { id: "medical", label: "Medical certification" },
  { id: "consultation", label: "Consultation (general check-up)" },
  { id: "follow-up", label: "Follow-up" },
  { id: "others", label: "Others" },
] as const;

const FALLBACK_TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

type Reason = (typeof reasonOptions)[number]["id"];

type ReserveFormState = {
  studentName: string;
  email: string;
  schoolIdNumber: string;
  address: string;
  reason: Reason;
  otherReasonDetail: string;
  preferredDate: string;
  preferredTime: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";
type SlotAvailability = {
  date: string;
  blocked: boolean;
  allFull: boolean;
  slotCapacity: number;
  slots: Array<{
    time: string;
    booked: number;
    capacity: number;
    full: boolean;
    disabled: boolean;
    available: boolean;
  }>;
};
type DateOverride = { date: string; available: boolean };

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatIsoDate(value: string): string {
  const date = fromIsoDate(value);
  if (!date) return "Select date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Normalize YYYY-M-D → YYYY-MM-DD so overrides match calendar ISO strings. */
function normalizeIsoDateInput(value: string): string {
  const t = value.trim();
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return t;
  const y = m[1];
  const mo = String(Number(m[2])).padStart(2, "0");
  const d = String(Number(m[3])).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

const initialState = (firstSlot: string): ReserveFormState => ({
  studentName: "",
  email: "",
  schoolIdNumber: "",
  address: "",
  reason: "consultation",
  otherReasonDetail: "",
  preferredDate: "",
  preferredTime: firstSlot,
});

export function ReserveForm() {
  const modalRoot = typeof document !== "undefined" ? document.body : null;
  const router = useRouter();
  const notifyAppointmentsChanged = useNotifyAppointmentsChanged();
  const minDateIso = useMemo(() => todayIsoDate(), []);
  const [timeSlots, setTimeSlots] = useState<string[]>(FALLBACK_TIME_SLOTS);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [slotCapacity, setSlotCapacity] = useState(10);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [scheduleRulesLoading, setScheduleRulesLoading] = useState(true);
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [activeModal, setActiveModal] = useState<"date" | "time" | null>(null);
  const [formState, setFormState] = useState<ReserveFormState>(() =>
    initialState(FALLBACK_TIME_SLOTS[0]!)
  );
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const loadScheduleRules = useCallback(async () => {
    setScheduleRulesLoading(true);
    try {
      const res = await fetch("/api/clinic-weekly-schedule", { cache: "no-store" });
      const data = (await res.json()) as {
        timeSlots?: string[];
        blockedDates?: string[];
        slotCapacity?: number;
        dateOverrides?: DateOverride[];
      };
      const slots =
        Array.isArray(data.timeSlots) && data.timeSlots.length > 0
          ? data.timeSlots
          : FALLBACK_TIME_SLOTS;
      setTimeSlots(slots);
      setBlockedDates(
        Array.isArray(data.blockedDates)
          ? data.blockedDates
              .filter((x): x is string => typeof x === "string")
              .map((x) => normalizeIsoDateInput(x))
          : []
      );
      setSlotCapacity(
        typeof data.slotCapacity === "number" && data.slotCapacity > 0
          ? Math.floor(data.slotCapacity)
          : 10
      );
      setDateOverrides(
        Array.isArray(data.dateOverrides)
          ? data.dateOverrides
              .filter(
                (e): e is DateOverride =>
                  !!e && typeof e === "object" && typeof (e as DateOverride).date === "string"
              )
              .map((entry) => ({
                date: normalizeIsoDateInput(entry.date),
                available: Boolean(entry.available),
              }))
          : []
      );
      setFormState((prev) => ({
        ...prev,
        preferredTime: slots.includes(prev.preferredTime) ? prev.preferredTime : slots[0]!,
      }));
    } finally {
      setScheduleRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScheduleRules();
        if (cancelled) return;
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadScheduleRules]);

  useEffect(() => {
    const date = formState.preferredDate.trim();
    if (!date) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    const loadAvailability = async () => {
      try {
        const res = await fetch(`/api/clinic-slot-availability?date=${encodeURIComponent(date)}`, {
          cache: "no-store",
        });
        const body = (await res.json()) as SlotAvailability & { error?: string };
        if (!res.ok) throw new Error(body.error || "Failed to load slot availability.");
        if (cancelled) return;
        setAvailability(body);

        if (body.blocked || body.allFull) {
          setSubmitState("error");
          setStatusMessage(
            body.blocked
              ? "That date is blocked by the clinic. Please choose another date."
              : "That date is fully booked. Please choose another date."
          );
          setFormState((prev) =>
            prev.preferredDate === date
              ? { ...prev, preferredDate: "", preferredTime: "" }
              : prev
          );
          return;
        }

        const chosen = formState.preferredTime.trim();
        const chosenSlot = body.slots.find((slot) => slot.time === chosen);
        if (chosenSlot?.disabled || chosenSlot?.full) {
          setStatusMessage(
            chosenSlot?.disabled
              ? "Selected time is disabled for this date. Please choose another slot."
              : "Selected time is already full. Please choose another slot."
          );
          setSubmitState("error");
          setFormState((prev) => ({ ...prev, preferredTime: "" }));
        }
      } catch {
        if (!cancelled) setAvailability(null);
      }
    };
    void loadAvailability();
    const timer = window.setInterval(() => {
      void loadAvailability();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [formState.preferredDate, formState.preferredTime]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/clinic/reserve-prefill");
        if (!res.ok) return;
        const data = (await res.json()) as {
          studentName?: string;
          email?: string;
          schoolIdNumber?: string;
          address?: string;
        };
        if (cancelled) return;
        setFormState((prev) => ({
          ...prev,
          studentName: data.studentName ?? prev.studentName,
          email: data.email ?? prev.email,
          schoolIdNumber: data.schoolIdNumber ?? prev.schoolIdNumber,
          address: data.address ?? prev.address,
        }));
      } catch {
        /* not signed in or guest */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof ReserveFormState>(
    field: K,
    value: ReserveFormState[K]
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setSubmitState("idle");
    setStatusMessage("");
  };

  const isOther = formState.reason === "others";

  const blockedDatesLabel = useMemo(() => {
    if (blockedDates.length === 0) return null;
    return blockedDates.sort().join(", ");
  }, [blockedDates]);
  const selectedDate = useMemo(
    () => fromIsoDate(formState.preferredDate),
    [formState.preferredDate]
  );

  const scheduleDateRules = useMemo(
    () => ({ blockedDates, dateOverrides }),
    [blockedDates, dateOverrides]
  );

  const isDateSelectable = useCallback(
    (value: string) => {
      if (scheduleRulesLoading) return false;
      const normalized = normalizeIsoDateInput(value);
      if (normalized < minDateIso) return false;
      return isDateAvailableForSchedule(normalized, scheduleDateRules);
    },
    [minDateIso, scheduleDateRules, scheduleRulesLoading]
  );

  useEffect(() => {
    const pickedDate = formState.preferredDate.trim();
    if (!pickedDate) return;
    if (scheduleRulesLoading) return;
    if (isDateSelectable(pickedDate)) return;
    setSubmitState("error");
    setStatusMessage("Your previously selected date is now unavailable. Please choose another date.");
    setFormState((prev) => ({ ...prev, preferredDate: "", preferredTime: "" }));
  }, [formState.preferredDate, isDateSelectable, scheduleRulesLoading]);

  useEffect(() => {
    if (activeModal !== "date") return;
    void loadScheduleRules();
  }, [activeModal, loadScheduleRules]);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeModal]);

  const resetForm = () => {
    setFormState(initialState(timeSlots[0] ?? FALLBACK_TIME_SLOTS[0]!));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("loading");
    setStatusMessage("");

    const schoolIdTrimmed = formState.schoolIdNumber.trim();
    const payload = {
      ...formState,
      studentName: formState.studentName.trim(),
      email: formState.email.trim(),
      schoolIdNumber: schoolIdTrimmed || undefined,
      address: formState.address.trim(),
      otherReasonDetail: formState.otherReasonDetail.trim(),
      preferredDate: formState.preferredDate.trim(),
      preferredTime: formState.preferredTime.trim(),
    };

    if (!payload.studentName) {
      setSubmitState("error");
      setStatusMessage("Student name is required.");
      return;
    }

    if (!payload.email) {
      setSubmitState("error");
      setStatusMessage("Email address is required.");
      return;
    }

    if (!payload.address) {
      setSubmitState("error");
      setStatusMessage("Address is required. Add it in Profile if you save it there.");
      return;
    }

    if (!payload.preferredDate) {
      setSubmitState("error");
      setStatusMessage("Preferred date is required.");
      return;
    }

    const preferredDateNorm = normalizeIsoDateInput(payload.preferredDate);
    if (!isDateAvailableForSchedule(preferredDateNorm, scheduleDateRules)) {
      setSubmitState("error");
      setStatusMessage("That date is unavailable (blocked by the clinic). Choose another date.");
      return;
    }
    if (availability?.blocked) {
      setSubmitState("error");
      setStatusMessage("That date is blocked by clinic schedule.");
      return;
    }
    if (availability?.allFull) {
      setSubmitState("error");
      setStatusMessage("All time slots for this date are full. Please choose another date.");
      return;
    }

    if (!payload.preferredTime) {
      setSubmitState("error");
      setStatusMessage("Preferred time is required.");
      return;
    }

    if (!timeSlots.includes(payload.preferredTime)) {
      setSubmitState("error");
      setStatusMessage("Choose a time from the clinic’s available slots.");
      return;
    }
    const chosenSlot = availability?.slots.find((slot) => slot.time === payload.preferredTime);
    if (chosenSlot?.disabled) {
      setSubmitState("error");
      setStatusMessage("That time slot is disabled for this date.");
      return;
    }
    if (chosenSlot?.full) {
      setSubmitState("error");
      setStatusMessage("That time slot is full. Please choose another time.");
      return;
    }

    if (payload.reason === "others" && !payload.otherReasonDetail) {
      setSubmitState("error");
      setStatusMessage(
        "Please specify your appointment reason when you select Others."
      );
      return;
    }

    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData?.error || "Unable to submit request.");
      }

      setSubmitState("success");
      setStatusMessage(
        responseData?.message ||
          "Your appointment has been submitted successfully! Redirecting..."
      );
      resetForm();
      notifyAppointmentsChanged();
      window.setTimeout(() => {
        router.push("/");
      }, 1400);
    } catch (error) {
      setSubmitState("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting your request."
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <Card className="border border-border px-5 py-8 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Reserve Appointment
            </CardTitle>
            <CardDescription>
              Your details and preferred slot are saved as a request. The same request appears
              under <strong>Appointment requests</strong> after you submit. Name, email, school
              ID, and address are auto-filled from your profile and cannot be edited here. Update
              them on the Profile page if needed.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 py-5">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="studentName" label="Student name">
                <Input
                  id="studentName"
                  name="studentName"
                  value={formState.studentName}
                  readOnly
                  disabled
                  required
                />
              </FormField>

              <FormField id="email" label="Email address">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  readOnly
                  disabled
                  required
                />
              </FormField>
            </div>

            <FormField
              id="schoolIdNumber"
              label="School ID number (optional)"
              helpText="From your profile; used to match your request in the system."
            >
              <Input
                id="schoolIdNumber"
                name="schoolIdNumber"
                value={formState.schoolIdNumber}
                readOnly
                disabled
                autoComplete="off"
              />
            </FormField>

            <FormField
              id="address"
              label="Address"
              helpText="Saved in your profile. Edit on Profile to update for future requests."
            >
              <Input
                id="address"
                name="address"
                value={formState.address}
                readOnly
                disabled
                required
              />
            </FormField>

            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground">
                Reason for appointment
              </p>
              <RadioGroup
                value={formState.reason}
                onValueChange={(value) => updateField("reason", value as Reason)}
                className="gap-3"
              >
                {reasonOptions.map((reason) => (
                  <div key={reason.id} className="flex items-center gap-3">
                    <RadioGroupItem value={reason.id} id={`reason-${reason.id}`} />
                    <Label htmlFor={`reason-${reason.id}`} className="font-normal">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {isOther ? (
              <FormField id="otherReasonDetail" label="Enter reason">
                <Input
                  id="otherReasonDetail"
                  name="otherReasonDetail"
                  type="text"
                  value={formState.otherReasonDetail}
                  onChange={(event) =>
                    updateField("otherReasonDetail", event.target.value)
                  }
                  placeholder="Enter reason"
                  required
                />
              </FormField>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="preferredDate"
                label="Preferred date"
                helpText={
                  blockedDatesLabel
                    ? `Unavailable dates: ${blockedDatesLabel}`
                    : "All dates are open unless blocked by the clinic."
                }
              >
                <input
                  type="hidden"
                  name="preferredDate"
                  value={formState.preferredDate}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between font-normal",
                    !formState.preferredDate && "text-muted-foreground"
                  )}
                  onClick={() => setActiveModal("date")}
                >
                  {formatIsoDate(formState.preferredDate)}
                </Button>
              </FormField>

              <FormField
                id="preferredTime"
                label="Preferred time"
                helpText="Slots are set by the clinic (View schedule / admin)."
              >
                <input
                  type="hidden"
                  name="preferredTime"
                  value={formState.preferredTime}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between font-normal",
                    !formState.preferredTime && "text-muted-foreground"
                  )}
                  onClick={() => {
                    if (!formState.preferredDate) {
                      setSubmitState("error");
                      setStatusMessage("Select a date first before picking a time slot.");
                      setActiveModal("date");
                      return;
                    }
                    setActiveModal("time");
                  }}
                >
                  {formState.preferredTime || "Select time"}
                </Button>
              </FormField>
            </div>

            {activeModal === "date" && modalRoot
              ? createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6"
                    onClick={() => setActiveModal(null)}
                  >
                    <div
                      className="w-full max-w-md rounded-2xl bg-background p-4 shadow-xl sm:p-5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">
                          Select preferred date
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveModal(null)}
                        >
                          Close
                        </Button>
                      </div>
                      {scheduleRulesLoading ? (
                        <p className="mb-2 text-sm text-muted-foreground">
                          Loading clinic calendar rules…
                        </p>
                      ) : null}
                      <div className="overflow-x-auto">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (!date) return;
                            if (scheduleRulesLoading) return;
                            const value = toIsoDate(date);
                            if (!isDateSelectable(value)) {
                              setStatusMessage(
                                "This date is unavailable in clinic schedule. Please choose another date."
                              );
                              setSubmitState("error");
                              return;
                            }
                            updateField("preferredDate", value);
                            setActiveModal("time");
                          }}
                          disabled={(date) => {
                            const value = toIsoDate(date);
                            return !isDateSelectable(value);
                          }}
                        />
                      </div>
                    </div>
                  </div>,
                  modalRoot
                )
              : null}

            {activeModal === "time" && modalRoot
              ? createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6"
                    onClick={() => setActiveModal(null)}
                  >
                    <div
                      className="w-full max-w-md rounded-2xl bg-background p-4 shadow-xl sm:p-5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">
                          Select preferred time
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveModal(null)}
                        >
                          Close
                        </Button>
                      </div>
                      <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {timeSlots.map((option) => {
                          const slot = availability?.slots.find((s) => s.time === option);
                          const full = Boolean(slot?.full || slot?.disabled);
                          const booked = slot?.booked ?? 0;
                          const cap = slot?.capacity ?? slotCapacity;
                          return (
                            <Button
                              key={option}
                              type="button"
                              variant={formState.preferredTime === option ? "default" : "outline"}
                              className="w-full justify-between"
                              disabled={full}
                              onClick={() => {
                                updateField("preferredTime", option);
                                setActiveModal(null);
                              }}
                            >
                              <span>{option}</span>
                              <span className="text-xs opacity-80">
                                {slot?.disabled
                                  ? "Unavailable"
                                  : full
                                    ? `Full (${booked}/${cap})`
                                    : `${booked}/${cap}`}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>,
                  modalRoot
                )
              : null}

            {availability ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                {availability.blocked ? (
                  <p className="text-destructive">
                    This date is blocked by the clinic. Choose another date.
                  </p>
                ) : availability.allFull ? (
                  <p className="text-destructive">
                    All time slots are full for this date. Choose another date.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Available slots: {availability.slots.filter((s) => !s.full).length} of{" "}
                    {availability.slots.length}. Capacity per slot: {availability.slotCapacity}.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex flex-col items-center gap-2 pt-2">
              <Button
                type="submit"
                size="sm"
                className="inline-flex"
                disabled={submitState === "loading"}
              >
                {submitState === "loading"
                  ? "Submitting..."
                  : submitState === "success"
                    ? "Submitted"
                    : submitState === "error"
                      ? "Retry"
                      : "Submit request"}
              </Button>
              {statusMessage ? (
                <p
                  className={
                    submitState === "success"
                      ? "text-sm text-green-700"
                      : "text-sm text-destructive"
                  }
                >
                  {statusMessage}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
