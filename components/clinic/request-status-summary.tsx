"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countRequestsByStatus } from "@/lib/clinic/mock-requests";

const rows = [
  {
    status: "pending" as const,
    label: "Pending",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-amber-600 tabular-nums",
  },
  {
    status: "approved" as const,
    label: "Approved",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-green-600 bg-green-600 px-2.5 py-0.5 text-white tabular-nums",
  },
  {
    status: "rejected" as const,
    label: "Rejected",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-red-600 tabular-nums",
  },
];

export function RequestStatusSummary() {
  const counts = countRequestsByStatus();

  return (
    <Card className="border border-neutral-200 bg-white shadow-sm ring-0 rounded-2xl">
      <CardHeader className="flex flex-row items-center gap-3 pb-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-base font-bold">My requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <p className="mb-4 text-[13px] text-muted-foreground px-1">
          Counts by status for your appointment requests.
        </p>
        <div className="flex flex-col gap-1">
          {rows.map((row) => {
            const count =
              row.status === "pending"
                ? counts.pending
                : row.status === "approved"
                  ? counts.approved
                  : counts.rejected;
            return (
              <Link
                key={row.status}
                href="/requests"
                className="flex items-center justify-between gap-2 rounded-xl border border-transparent px-3 py-3 text-sm transition-colors hover:bg-neutral-50"
              >
                <span className="font-semibold text-foreground text-[14px]">{row.label}</span>
                <span className="flex items-center gap-2">
                  <span className={row.badgeClass}>
                    {count}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
