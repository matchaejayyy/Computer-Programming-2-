"use client";

import { BackToHome } from "@/components/clinic/back-to-home";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const reasons = [
  { id: "medical", label: "Medical certification" },
  { id: "consultation", label: "Consultation (general check-up)" },
  { id: "follow-up", label: "Follow-up" },
  { id: "others", label: "Others" },
] as const;

export default function ReservePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card className="border border-clinic-blue/30 bg-clinic-surface shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">
            Reserve appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          <p className="text-sm text-muted-foreground">
            Fill in your details and reason. The clinic will review your request
            and update your appointment status.
          </p>
          <div className="space-y-2">
            <Label htmlFor="name">Student name</Label>
            <Input id="name" placeholder="Full name as on school records" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@usa.edu.ph"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Street, barangay, city" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Reason for appointment
            </p>
            <RadioGroup defaultValue="consultation" className="gap-3">
              {reasons.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <RadioGroupItem value={r.id} id={`r-${r.id}`} />
                  <Label htmlFor={`r-${r.id}`} className="font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Button type="button" size="lg" className="w-full">
            Submit appointment request
          </Button>
        </CardContent>
      </Card>
      <BackToHome />
    </div>
  );
}
