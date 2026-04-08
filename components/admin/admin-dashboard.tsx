"use client";

import {
  Activity,
  Ban,
  BarChart3,
  CalendarCog,
  CalendarRange,
  CheckCircle2,
  History,
  IdCard,
  Inbox,
  ListChecks,
  Megaphone,
  NotebookPen,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "red" | "blue" | "amber" | "emerald" | "slate";

const accentIconStyles: Record<Accent, string> = {
  red: "bg-red-50 text-[#E50000]",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-800",
  emerald: "bg-emerald-50 text-emerald-800",
  slate: "bg-slate-100 text-slate-700",
};

type AdminPortalLink = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
};

const adminPortalLinks: AdminPortalLink[] = [
  {
    key: "patient-finder",
    title: "Student registry finder",
    description: "Look up accounts, profiles, and BMI records",
    href: "/admin/patient-finder",
    icon: IdCard,
    accent: "emerald",
  },
  {
    key: "requests",
    title: "Appointment requests",
    description: "Review pending requests and approve or reject",
    href: "/admin/requests",
    icon: Inbox,
    accent: "blue",
  },
  {
    key: "status-management",
    title: "Status management",
    description: "Mark approved visits as completed or no-show",
    href: "/admin/status-management",
    icon: ListChecks,
    accent: "blue",
  },
  {
    key: "edit-schedule",
    title: "Edit clinic schedule",
    description: "Configure weekly hours and slot rules",
    href: "/admin/edit-clinic-schedule",
    icon: CalendarCog,
    accent: "amber",
  },
  {
    key: "schedule",
    title: "Manage schedule",
    description: "Set time slots and block unavailable dates",
    href: "/admin/schedule",
    icon: CalendarRange,
    accent: "amber",
  },
  {
    key: "history",
    title: "Appointment history",
    description: "Browse past visits with date and status filters",
    href: "/admin/history",
    icon: History,
    accent: "slate",
  },
  {
    key: "visitor-log",
    title: "Visitor log",
    description: "Record visitors and track on-site visits",
    href: "/admin/visitor-log",
    icon: NotebookPen,
    accent: "emerald",
  },
  {
    key: "broadcast",
    title: "Broadcast notifications",
    description: "Send announcements to students and staff",
    href: "/admin/broadcast-notifications",
    icon: Megaphone,
    accent: "red",
  },
  {
    key: "reports",
    title: "Clinic reports",
    description: "Statistics and downloadable reports",
    href: "/admin/reports",
    icon: BarChart3,
    accent: "amber",
  },
];

/* ================= COMPONENT ================= */

export function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    no_show: 0,
    completed: 0,
  });
  useEffect(() => {
    fetch("/api/admin-stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          no_show: 0,
          completed: 0,
        });
      });
  }, []);

  const statsData = [
    {
      title: "Total Appointments",
      value: stats.total,
      note: "All records",
      icon: CalendarRange,
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
      note: "Confirmed visits pending marking",
      icon: CheckCircle2,
      tone: "bg-[#16a34a]/10 text-[#16a34a]",
    },
    {
      title: "Completed",
      value: stats.completed,
      note: "Marked completed after visit",
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      note: "Declined requests",
      icon: XCircle,
      tone: "bg-[#dc2626]/10 text-[#dc2626]",
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      note: "Cancelled by students",
      icon: Ban,
      tone: "bg-slate-200 text-slate-700",
    },
    {
      title: "No Show",
      value: stats.no_show,
      note: "Marked by admins",
      icon: XCircle,
      tone: "bg-red-100 text-red-700",
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-7">
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
          <p className="mt-1 text-sm text-muted-foreground">
            Quick access to clinic tools — each card opens a dedicated area.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {adminPortalLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={item.href} className="group block h-full min-h-[108px]">
                <Card className="h-full rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50/80">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl",
                        accentIconStyles[item.accent]
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <CardTitle className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-[#E50000]">
                        {item.title}
                      </CardTitle>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
