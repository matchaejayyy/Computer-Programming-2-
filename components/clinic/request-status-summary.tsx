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
      "border-amber-200 bg-amber-50 text-amber-900 tabular-nums",
  },
  {
    status: "approved" as const,
    label: "Approved",
    badgeClass:
      "border-green-600 bg-green-600 text-white tabular-nums",
  },
  {
    status: "rejected" as const,
    label: "Rejected",
    badgeClass: "border-red-200 bg-red-50 text-red-800 tabular-nums",
  },
];

export function RequestStatusSummary() {
  const counts = countRequestsByStatus();

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-base font-semibold">My requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="mb-2 text-xs text-muted-foreground">
          Open a category to read full information for each appointment request.
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
              href={`/requests?status=${row.status}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-muted/60"
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
