"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/clinic/form-field";
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
  slots: Array<{ time: string; booked: number; capacity: number; full: boolean }>;
};
type WeeklyHourRow = { label: string; hours: string };

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const router = useRouter();
  const [timeSlots, setTimeSlots] = useState<string[]>(FALLBACK_TIME_SLOTS);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [slotCapacity, setSlotCapacity] = useState(10);
  const [availability, setAvailability] = useState<SlotAvailability | null>(null);
  const [formState, setFormState] = useState<ReserveFormState>(() =>
    initialState(FALLBACK_TIME_SLOTS[0]!)
  );
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/clinic-weekly-schedule");
        const data = (await res.json()) as {
          timeSlots?: string[];
          blockedDates?: string[];
          slotCapacity?: number;
        };
        if (cancelled) return;
        const slots =
          Array.isArray(data.timeSlots) && data.timeSlots.length > 0
            ? data.timeSlots
            : FALLBACK_TIME_SLOTS;
        setTimeSlots(slots);
        setBlockedDates(Array.isArray(data.blockedDates) ? data.blockedDates : []);
        setSlotCapacity(
          typeof data.slotCapacity === "number" && data.slotCapacity > 0
            ? Math.floor(data.slotCapacity)
            : 10
        );
        setFormState((prev) => ({
          ...prev,
          preferredTime: slots.includes(prev.preferredTime)
            ? prev.preferredTime
            : slots[0]!,
        }));
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const date = formState.preferredDate.trim();
    if (!date) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/clinic-slot-availability?date=${encodeURIComponent(date)}`
        );
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
        if (chosenSlot?.full) {
          setStatusMessage("Selected time is already full. Please choose another slot.");
          setSubmitState("error");
          setFormState((prev) => ({ ...prev, preferredTime: "" }));
        }
      } catch {
        if (!cancelled) setAvailability(null);
      }
    })();
    return () => {
      cancelled = true;
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

    if (blockedDates.includes(payload.preferredDate)) {
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
          "Appointment form has already been submitted. Redirecting to home..."
      );
      resetForm();
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
              <p className="text-sm font-medium text-foreground">
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
                <Input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  min={todayIsoDate()}
                  value={formState.preferredDate}
                  onChange={(event) => {
                    const v = event.target.value;
                    if (blockedDates.includes(v)) {
                      setStatusMessage(
                        "This date is blocked. Please choose another date."
                      );
                      setSubmitState("error");
                      return;
                    }
                    updateField("preferredDate", v);
                  }}
                  required
                />
              </FormField>

              <FormField
                id="preferredTime"
                label="Preferred time"
                helpText="Slots are set by the clinic (View schedule / admin)."
              >
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={formState.preferredTime}
                  onChange={(event) =>
                    updateField("preferredTime", event.target.value)
                  }
                  required
                  className="h-10 w-full rounded-lg border border-input bg-white px-2.5 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((option) => {
                    const slot = availability?.slots.find((s) => s.time === option);
                    const full = Boolean(slot?.full);
                    const booked = slot?.booked ?? 0;
                    const cap = slot?.capacity ?? slotCapacity;
                    return (
                      <option key={option} value={option} disabled={full}>
                        {full ? `${option} — Full (${booked}/${cap})` : `${option} (${booked}/${cap})`}
                      </option>
                    );
                  })}
                </select>
              </FormField>
            </div>

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
