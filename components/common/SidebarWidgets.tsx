"use client";

import * as React from "react";

import { RequestStatusSummary } from "@/components/student/requests/StatusSummary";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

export function SidebarWidgets() {
  const [month, setMonth] = React.useState(() => new Date(2026, 2, 1));
  const [selected, setSelected] = React.useState<Date | undefined>(
    () => new Date(2026, 2, 30)
  );

  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start">
      <Card className="border border-neutral-200 bg-white shadow-sm ring-0 rounded-3xl">
        <CardContent className="flex flex-col items-center p-4 sm:p-5">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            className="mx-auto w-full max-w-[17rem] rounded-2xl border-0 p-0 text-foreground [--cell-size:1.8rem] sm:[--cell-size:1.95rem] lg:[--cell-size:2.05rem]"
            captionLayout="label"
          />
        </CardContent>
      </Card>

      <RequestStatusSummary />
    </aside>
  );
}
