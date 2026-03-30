import { CalendarDays } from "lucide-react";

import { BackToHome } from "@/components/clinic/back-to-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKLY_CLINIC_HOURS } from "@/lib/clinic/clinic-schedule";

export default function SchedulePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="border-2 border-clinic-blue bg-clinic-surface shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-clinic-blue text-white">
            <CalendarDays className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-lg text-foreground">
            View clinic schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Weekly hours for the San Agustin campus clinic. Appointments outside
            these times are not offered except for emergencies (seek urgent care
            or hospital services).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {WEEKLY_CLINIC_HOURS.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="font-semibold text-foreground">{row.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{row.hours}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <BackToHome />
    </div>
  );
}
