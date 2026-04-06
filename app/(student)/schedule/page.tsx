import { CalendarDays } from "lucide-react";

import { HomeLink } from "@/components/clinic/home-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyClinicHoursFromDisk } from "@/lib/clinic/clinic-weekly-hours-store";

export default async function SchedulePage() {
  const weeklyRows = await getWeeklyClinicHoursFromDisk();

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <Card className="border border-neutral-200 px-5 py-8 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-neutral-200 pb-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200">
            <CalendarDays className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-lg font-bold text-foreground">
            View clinic schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Weekly hours for the San Agustin campus clinic. Appointments outside
            these times are not offered except for emergencies (seek urgent care
            or hospital services).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {weeklyRows.map((row) => (
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
    </div>
  );
}