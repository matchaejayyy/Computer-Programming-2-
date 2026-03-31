"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { RequestStatusSummary } from "@/components/clinic/request-status-summary";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarWidgets() {
  const [month, setMonth] = React.useState(() => new Date(2026, 2, 1));
  const [selected, setSelected] = React.useState<Date | undefined>(
    () => new Date(2026, 2, 30)
  );

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
      <Card className="border border-neutral-200 bg-white shadow-sm ring-0">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <CalendarIcon className="size-5" aria-hidden />
          </span>
          <CardTitle className="text-base font-semibold">Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-4 pt-0">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            className="w-full max-w-[280px] rounded-lg border-0 p-0 [--cell-size:2rem] sm:[--cell-size:2.25rem]"
            captionLayout="label"
          />
        </CardContent>
      </Card>

      <RequestStatusSummary />
    </aside>
  );
}
