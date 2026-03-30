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
      "min-w-8 justify-center rounded-full border-amber-300 bg-amber-100 px-2.5 py-0.5 text-amber-900 tabular-nums",
  },
  {
    status: "approved" as const,
    label: "Approved",
    badgeClass:
      "min-w-8 justify-center rounded-full border-green-600 bg-green-600 px-2.5 py-0.5 text-white tabular-nums",
  },
  {
    status: "rejected" as const,
    label: "Rejected",
    badgeClass:
      "min-w-8 justify-center rounded-full border-red-200 bg-red-50 px-2.5 py-0.5 text-red-800 tabular-nums",
  },
];

export function RequestStatusSummary() {
  const counts = countRequestsByStatus();

  return (
    <Card className="border border-neutral-200 bg-white shadow-sm ring-0">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-base font-semibold">My requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="mb-2 text-xs text-muted-foreground">
          Counts by status for your appointment requests.
        </p>
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
              className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-neutral-200 hover:bg-neutral-50"
            >
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5">
                <Badge variant="outline" className={row.badgeClass}>
                  {count}
                </Badge>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
