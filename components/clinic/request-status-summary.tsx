"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ClipboardList } from "lucide-react";

import { useClinicStudentId } from "@/components/clinic/clinic-student-bridge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  {
    status: "pending" as const,
    label: "Pending",
    href: "/requests?filter=pending",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-amber-600 tabular-nums",
  },
  {
    status: "approved" as const,
    label: "Approved",
    href: "/requests?filter=approved",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-green-600 bg-green-600 px-2.5 py-0.5 text-white tabular-nums",
  },
  {
    status: "rejected" as const,
    label: "Rejected",
    href: "/requests?filter=rejected",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-red-600 tabular-nums",
  },
  {
    status: "cancelled" as const,
    label: "Cancelled",
    href: "/requests?filter=cancelled",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-slate-700 tabular-nums",
  },
  {
    status: "no_show" as const,
    label: "No Show",
    href: "/requests?filter=no_show",
    badgeClass:
      "min-w-8 justify-center rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-red-900 tabular-nums",
  },
];

type Props = {
  studentId?: string;
};

export function RequestStatusSummary({ studentId: studentIdProp }: Props) {
  const fromContext = useClinicStudentId();
  const studentId = studentIdProp ?? fromContext;
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    no_show: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studentId) {
        if (!cancelled) {
          setCounts({ pending: 0, approved: 0, rejected: 0, cancelled: 0, no_show: 0 });
          setMounted(true);
        }
        return;
      }
      try {
        const res = await fetch(
          `/api/clinic-requests/stats?studentId=${encodeURIComponent(studentId)}`
        );
        const data = (await res.json()) as {
          pending?: number;
          approved?: number;
          rejected?: number;
          cancelled?: number;
          no_show?: number;
        };
        if (!cancelled && res.ok) {
          setCounts({
            pending: data.pending ?? 0,
            approved: data.approved ?? 0,
            rejected: data.rejected ?? 0,
            cancelled: data.cancelled ?? 0,
            no_show: data.no_show ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setCounts({ pending: 0, approved: 0, rejected: 0, cancelled: 0, no_show: 0 });
        }
      } finally {
        if (!cancelled) {
          setMounted(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

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
        {rows.map((row) => {
          const count =
            row.status === "pending"
              ? counts.pending
              : row.status === "approved"
                ? counts.approved
                : row.status === "rejected"
                  ? counts.rejected
                  : row.status === "cancelled"
                    ? counts.cancelled
                    : counts.no_show;
          return (
            <Link
              key={row.status}
              href={row.href}
              className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-muted/50"
            >
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5">
                <Badge variant="outline" className={row.badgeClass}>
                  {mounted ? count : "—"}
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
