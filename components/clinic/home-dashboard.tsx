import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderClock,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { SidebarWidgets } from "./sidebar-widgets";

const clinicLinks = [
  {
    href: "/schedule",
    title: "View clinic schedule",
    desc: "See which days the clinic is open and daily visiting hours.",
    icon: CalendarDays,
    highlight: true,
  },
  {
    href: "/reserve",
    title: "Reserve appointment",
    desc: "Submit a request for certification, consultation, or follow-up.",
    icon: FileText,
    highlight: false,
  },
  {
    href: "/requests",
    title: "Check appointment status",
    desc: "Track whether your request is pending, approved, or rejected.",
    icon: ClipboardCheck,
    highlight: false,
  },
  {
    href: "/history",
    title: "History",
    desc: "Review dates, reasons, and outcomes of past clinic visits.",
    icon: FolderClock,
    highlight: false,
  },
] as const;

export function HomeDashboard() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <Card className="overflow-hidden border-0 bg-primary text-primary-foreground shadow-md">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
              University of San Agustin sdfasd 
            </p>
            <h2 className="text-xl font-bold sm:text-2xl">
              Student health &amp; medical services
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed opacity-95">
              Book appointments, check medical certification and consultation
              requests, and follow your visit status — all in one place. For
              emergencies, contact campus security or go to the nearest hospital.
            </p>
            <div className="max-w-md space-y-3 rounded-xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <Skeleton className="h-3 w-28 rounded-md bg-white/25" />
              <div className="space-y-2.5 pt-1">
                <Skeleton className="h-4 w-full max-w-md rounded-md bg-white/20" />
                <Skeleton className="h-4 w-full max-w-[90%] rounded-md bg-white/20" />
                <Skeleton className="h-4 w-full max-w-[85%] rounded-md bg-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground sm:text-xl">
              Clinic services
            </h3>
            <Button variant="ghost" size="icon" type="button" aria-label="Menu">
              <MoreHorizontal className="size-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clinicLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <Card
                    className={
                      item.highlight
                        ? "h-full border-2 border-primary bg-clinic-surface transition-colors hover:bg-clinic-surface/80"
                        : "h-full border border-border bg-card transition-colors hover:bg-muted/30"
                    }
                  >
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                      <span
                        className={
                          item.highlight
                            ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                            : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
                        }
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="lg:col-span-4">
        <SidebarWidgets />
      </div>
    </div>
  );
}
