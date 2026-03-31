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
import { cn } from "@/lib/utils";

import { SidebarWidgets } from "./sidebar-widgets";

const clinicLinks = [
  {
    href: "/schedule",
    title: "View clinic schedule",
    icon: CalendarDays,
    isActive: true, 
  },
  {
    href: "/reserve",
    title: "Reserve appointment",
    icon: FileText,
    isActive: false,
  },
  {
    href: "/requests",
    title: "Check appointment status",
    icon: ClipboardCheck,
    isActive: false,
  },
  {
    href: "/history",
    title: "History",
    icon: FolderClock,
    isActive: false,
  },
] as const;

export function HomeDashboard() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-6">
      <div className="flex flex-col gap-6 xl:col-span-8">
        <Card className="overflow-hidden border-0 bg-[#E50000] text-white shadow-sm ring-0 rounded-2xl">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/90">
              University of San Agustin Clinic
            </p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Student health &amp; medical services
            </h2>
            <p className="max-w-2xl text-[15px] leading-relaxed text-white/95 pb-2">
              Book appointments, check medical certification and consultation
              requests, and follow your visit status — all in one place. For
              emergencies, contact campus security or go to the nearest hospital.
            </p>
            <div className="max-w-md space-y-3 rounded-2xl border-2 border-white/10 bg-white/5 p-5">
              <Skeleton className="h-3 w-32 rounded-full bg-white/20" />
              <div className="space-y-3 pt-1">
                <Skeleton className="h-3.5 w-full max-w-sm rounded-full bg-white/20" />
                <Skeleton className="h-3.5 w-full max-w-[85%] rounded-full bg-white/20" />
                <Skeleton className="h-3.5 w-full max-w-[75%] rounded-full bg-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-foreground">
              Clinic services
            </h3>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Menu"
              className="rounded-xl"
            >
              <MoreHorizontal className="size-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {clinicLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="block group">
                  <Card
                    className={cn(
                      "flex h-20 items-center justify-start p-4 transition-all duration-200 ring-0 shadow-none rounded-2xl",
                      item.isActive
                        ? "border-[#E50000] border-2 bg-white"
                        : "border-neutral-200 border bg-white hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          item.isActive
                            ? "bg-[#E50000] text-white"
                            : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {item.title}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="xl:col-span-4">
        <SidebarWidgets />
      </div>
    </div>
  );
}
