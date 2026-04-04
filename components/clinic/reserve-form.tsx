"use client";

import { FormEvent, useState } from "react";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/clinic/form-field";

const reasonOptions = [
  { id: "medical", label: "Medical certification" },
  { id: "consultation", label: "Consultation (general check-up)" },
  { id: "follow-up", label: "Follow-up" },
  { id: "others", label: "Others" },
] as const;

const availableTimes = [
  { value: "8:00 AM", label: "8:00 AM" },
  { value: "9:00 AM", label: "9:00 AM" },
  { value: "10:00 AM", label: "10:00 AM" },
  { value: "11:00 AM", label: "11:00 AM" },
  { value: "12:00 PM", label: "12:00 PM" },
  { value: "1:00 PM", label: "1:00 PM" },
  { value: "2:00 PM", label: "2:00 PM" },
  { value: "3:00 PM", label: "3:00 PM" },
  { value: "4:00 PM", label: "4:00 PM" },
] as const;

type Reason = (typeof reasonOptions)[number]["id"];

type ReserveFormState = {
  studentName: string;
  email: string;
  address: string;
  reason: Reason;
  otherReasonDetail: string;
  preferredDate: string;
  preferredTime: (typeof availableTimes)[number]["value"];
};

type SubmitState = "idle" | "loading" | "success" | "error";

const initialState: ReserveFormState = {
  studentName: "",
  email: "",
  address: "",
  reason: "consultation",
  otherReasonDetail: "",
  preferredDate: "",
  preferredTime: "8:00 AM",
};

export function ReserveForm() {
  const [formState, setFormState] = useState<ReserveFormState>(initialState);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const updateField = <K extends keyof ReserveFormState>(
    field: K,
    value: ReserveFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setSubmitState("idle");
    setStatusMessage("");
  };

  const isOther = formState.reason === "others";

  const resetForm = () => {
    setFormState(initialState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("loading");
    setStatusMessage("");

    const payload = {
      ...formState,
      studentName: formState.studentName.trim(),
      email: formState.email.trim(),
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
      setStatusMessage("Address is required.");
      return;
    }

    if (!payload.preferredDate) {
      setSubmitState("error");
      setStatusMessage("Preferred date is required.");
      return;
    }

    if (!payload.preferredTime) {
      setSubmitState("error");
      setStatusMessage("Preferred time is required.");
      return;
    }

    if (payload.reason === "others" && !payload.otherReasonDetail) {
      setSubmitState("error");
      setStatusMessage(
        "Please specify your appointment reason when you select Others.",
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
        responseData?.message || "Appointment request submitted successfully.",
      );
      resetForm();
    } catch (error) {
      setSubmitState("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting your request.",
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Reserve Appointment
        </h1>
        <p className="mt-1 text-sm mb-4 text-muted-foreground">
          Fill in your details and reason. The clinic will review your request
          and update your appointment status.
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border px-6 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200">
            <ClipboardList className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-lg font-bold text-foreground">
            Appointment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6 py-5">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="studentName" label="Student name">
                <Input
                  id="studentName"
                  name="studentName"
                  value={formState.studentName}
                  onChange={(event) =>
                    updateField("studentName", event.target.value)
                  }
                  placeholder="Enter full name"
                  required
                />
              </FormField>

              <FormField id="email" label="Email address">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@usa.edu.ph"
                  required
                />
              </FormField>
            </div>

            <FormField id="address" label="Address">
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={formState.preferredDate}
                onChange={(event) => updateField("preferredDate", event.target.value)}
                required
              />
            </FormField>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Reason for appointment
              </p>
              <RadioGroup
                value={formState.reason}
                onValueChange={(value) =>
                  updateField("reason", value as Reason)
                }
              >
                {statusMessage}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
