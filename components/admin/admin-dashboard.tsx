"use client";

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  FolderClock,
  LayoutDashboard,
  XCircle,
  Settings2,
} from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorStyles = {
  green: "bg-[#65a30d]",
  blue: "bg-[#1d4ed8]",
  amber: "bg-[#d97706]",
} as const;

const adminMenuCards = [
  {
    title: "Dashboard",
    subtitle: "View Overview",
    details: ["Total Appointments", "Pending Requests", "Approved / Rejected"],
    icon: LayoutDashboard,
    color: "green",
    href: "/admin",
  },
  {
    title: "Manage Appointments",
    subtitle: "View All Requests",
    details: ["View Request", "Status Management", "Edit Schedule"],
    detailHrefs: ["/admin/requests", "/admin/status-management", "/admin/edit-clinic-schedule"],
    icon: ClipboardCheck,
    color: "blue",
  },
  {
    title: "Manage Schedule",
    subtitle: "Set Available Dates",
    details: ["Set Time Slots", "Block Unavailable Dates"],
    icon: CalendarDays,
    color: "amber",
    href: "/admin/schedule",
  },
  {
    title: "Status Management",
    subtitle: "Track Requests",
    details: ["Pending → Approved", "Pending → Rejected", "Overview counts"],
    icon: Settings2,
    color: "green",
    href: "/admin/status-management",
  },
  {
    title: "Appointment History",
    subtitle: "View Past Appointments",
    details: ["Filter by Date", "Filter by Student", "Filter by Status"],
    icon: FolderClock,
    color: "blue",
    href: "/admin/history",
  },
  {
    title: "Reports",
    subtitle: "Clinic Reporting",
    details: ["Patient Statistics", "Download Reports", "click"],
    icon: FileSpreadsheet,
    color: "amber",
    href: "/admin/reports",
  },
] as const satisfies ReadonlyArray<{
  title: string;
  subtitle: string;
  details: readonly string[];
  icon: (typeof LayoutDashboard) | typeof ClipboardCheck | typeof CalendarDays | typeof Settings2 | typeof FolderClock | typeof FileSpreadsheet;
  color: keyof typeof colorStyles;
  href?: string;
  detailHrefs?: readonly string[];
}>;

/* ================= COMPONENT ================= */

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  useEffect(() => {
    fetch("/api/admin-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {
        // fallback if API not ready
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        });
      });
  }, []);

  const statsData = [
    {
      title: "Total Appointments",
      value: stats.total,
      note: "All records",
      icon: CalendarDays,
      tone: "bg-[#1d4ed8]/10 text-[#1d4ed8]",
    },
    {
      title: "Pending Requests",
      value: stats.pending,
      note: "Needs review",
      icon: Activity,
      tone: "bg-[#d97706]/10 text-[#d97706]",
    },
    {
      title: "Approved",
      value: stats.approved,
      note: "Processed successfully",
      icon: CheckCircle2,
      tone: "bg-[#16a34a]/10 text-[#16a34a]",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      note: "Declined requests",
      icon: XCircle,
      tone: "bg-[#dc2626]/10 text-[#dc2626]",
    },
  ];

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-6">
      {/* HEADER */}
      <Card className="overflow-hidden border-0 bg-[#E50000] text-white shadow-sm ring-0 rounded-2xl">
        <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-white/90">
            San Agustin Clinic System
          </p>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Admin / Staff Portal</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/95 sm:text-[15px]">
            Monitor appointment activity, review request statuses, and coordinate
            daily clinic operations from one centralized admin dashboard.
          </p>
        </CardContent>
      </Card>

      {/* STATS */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">Dashboard statistics</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Real-time data</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {statsData.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-none"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                        {item.title}
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.note}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl",
                        item.tone
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* MENU */}
      <section className="space-y-3 sm:space-y-4">
        <div className="px-1">
          <h2 className="text-lg font-bold text-foreground sm:text-xl">Admin portal menu</h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminMenuCards.map((item) => {
            const Icon = item.icon;

            if ("detailHrefs" in item && item.detailHrefs) {
              return (
                <Card
                  key={item.title}
                  className="h-full rounded-2xl border border-neutral-200 bg-white shadow-none flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl text-white",
                          colorStyles[item.color]
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <CardTitle className="text-base font-bold text-foreground">
                          {item.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-[120px]">
                    <div className="space-y-2">
                      {item.details.map((detail, index) => (
                        <Link
                          key={detail}
                          href={item.detailHrefs[index] ?? "/admin/requests"}
                          className="block min-h-10 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-foreground"
                        >
                          {detail}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            }

            if (!("href" in item)) {
              return null;
            }

            return (
              <Link key={item.title} href={item.href} className="block h-full">
                <Card className="h-full rounded-2xl border border-neutral-200 bg-white shadow-none transition-colors hover:bg-neutral-50 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl text-white",
                          colorStyles[item.color]
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <CardTitle className="text-base font-bold text-foreground">
                          {item.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 min-h-[120px]">
                    <div className="space-y-2">
                      {item.details.map((detail) => (
                        <div
                          key={detail}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-foreground"
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}