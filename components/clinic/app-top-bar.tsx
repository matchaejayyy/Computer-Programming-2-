"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";

import { ProfileMenu } from "@/components/clinic/profile-menu";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";

type NotificationItem = {
  key: string;
  title: string;
  message: string;
  submittedAt: string;
  status: RequestStatus;
};

function statusTitle(status: RequestStatus): string {
  if (status === "approved") return "Appointment approved";
  if (status === "rejected") return "Appointment rejected";
  if (status === "cancelled") return "Appointment cancelled";
  if (status === "no_show") return "Appointment completed";
  return "Appointment update";
}

function statusMessage(req: AppointmentRequest): string {
  if (req.status === "approved") {
    return `Your request ${req.id} has been approved.`;
  }
  if (req.status === "rejected") {
    return `Your request ${req.id} was rejected.${req.clinicNote ? ` Note: ${req.clinicNote}` : ""}`;
  }
  if (req.status === "cancelled") {
    return `Your request ${req.id} has been cancelled.`;
  }
  if (req.status === "no_show") {
    return `Your request ${req.id} is marked as completed/no show.`;
  }
  return `Your request ${req.id} is still pending.`;
}

export function AppTopBar({ studentId }: { studentId?: string }) {
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenKeys, setSeenKeys] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clinic-requests?studentId=${encodeURIComponent(studentId)}`);
        const body = (await res.json()) as { appointments?: AppointmentRequest[] };
        if (!res.ok || cancelled) return;
        setAppointments(Array.isArray(body.appointments) ? body.appointments : []);
      } catch {
        if (!cancelled) setAppointments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    try {
      const raw = localStorage.getItem(`student_notifications_seen_${studentId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, true>;
      setSeenKeys(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      setSeenKeys({});
    }
  }, [studentId]);

  const notifications = useMemo<NotificationItem[]>(() => {
    return appointments
      .filter((req) => req.status !== "pending")
      .map((req) => ({
        key: `${req.id}:${req.status}`,
        title: statusTitle(req.status),
        message: statusMessage(req),
        submittedAt: req.submittedAt,
        status: req.status,
      }))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [appointments]);

  const unreadCount = notifications.filter((n) => !seenKeys[n.key]).length;

  function markAllAsRead() {
    if (!studentId || notifications.length === 0) return;
    const next: Record<string, true> = { ...seenKeys };
    for (const note of notifications) {
      next[note.key] = true;
    }
    setSeenKeys(next);
    try {
      localStorage.setItem(`student_notifications_seen_${studentId}`, JSON.stringify(next));
    } catch {
      /* ignore storage write errors */
    }
  }

  return (
    <div className="border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Link
          href="/"
          className="min-w-0 shrink text-base font-bold tracking-tight text-foreground sm:text-lg"
        >
          USA Medical Services Portal
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => {
              setMenuOpen(open);
              if (open) markAllAsRead();
            }}
          >
            <DropdownMenuTrigger
              aria-label="Notifications"
              className="relative inline-flex size-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-neutral-100"
            >
              <Bell className="size-5" />
              {unreadCount > 0 ? (
                <Badge className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border-0 bg-[#E50000] p-0 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[min(92vw,24rem)] rounded-xl border border-border/60 bg-card p-1.5 shadow-lg"
            >
              <DropdownMenuLabel className="px-2 py-1 text-sm font-semibold text-foreground">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-2 py-5 text-center text-sm text-muted-foreground">
                  No appointment updates yet.
                </div>
              ) : (
                notifications.slice(0, 8).map((note) => (
                  <DropdownMenuItem
                    key={note.key}
                    className="items-start gap-2 rounded-lg px-2 py-2.5"
                  >
                    <div className="mt-1 size-2 rounded-full bg-[#E50000]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{note.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{note.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-center text-xs text-muted-foreground">
                Open <span className="font-semibold text-foreground">Appointment Requests</span> page
                to view complete details.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border-l border-neutral-200 pl-2 sm:pl-3 cursor-pointer">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
