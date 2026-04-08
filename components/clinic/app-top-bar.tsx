"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";

import { ProfileMenu } from "@/components/clinic/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppointmentRefreshKey } from "@/components/clinic/clinic-student-bridge";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";

type NotificationItem = {
  key: string;
  title: string;
  message: string;
  createdAt: string;
  kind: "appointment" | "broadcast";
  status?: RequestStatus;
  requestId?: string;
  href: string;
  attachmentName?: string;
  attachmentPath?: string;
  attachmentMimeType?: string;
};

function statusTitle(status: RequestStatus): string {
  if (status === "approved") return "Appointment approved";
  if (status === "rejected") return "Appointment rejected";
  if (status === "cancelled") return "Appointment cancelled";
  if (status === "no_show") return "Marked no show";
  if (status === "completed") return "Visit completed";
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
    return `Your request ${req.id} was marked as no show.${req.clinicNote ? ` Note: ${req.clinicNote}` : ""}`;
  }
  if (req.status === "completed") {
    return `Your visit for ${req.id} was marked completed.${req.clinicNote ? ` Note: ${req.clinicNote}` : ""}`;
  }
  return `Your request ${req.id} is still pending.`;
}

export function AppTopBar({ studentId }: { studentId?: string }) {
  const router = useRouter();
  const appointmentRefreshKey = useAppointmentRefreshKey();
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [broadcasts, setBroadcasts] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      createdAt: string;
      attachmentName?: string;
      attachmentPath?: string;
      attachmentMimeType?: string;
    }>
  >([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenKeys, setSeenKeys] = useState<Record<string, true>>({});
  const [selectedBroadcast, setSelectedBroadcast] = useState<NotificationItem | null>(null);

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
  }, [studentId, appointmentRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/broadcast-notifications");
        const body = (await res.json()) as {
          notifications?: Array<{ id: string; title: string; message: string; createdAt: string }>;
        };
        if (!res.ok || cancelled) return;
        setBroadcasts(Array.isArray(body.notifications) ? body.notifications : []);
      } catch {
        if (!cancelled) setBroadcasts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!studentId) return;
    try {
      const raw = localStorage.getItem(`student_notifications_seen_${studentId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, true>;
      const next = parsed && typeof parsed === "object" ? parsed : {};
      window.setTimeout(() => {
        setSeenKeys(next);
      }, 0);
    } catch {
      window.setTimeout(() => {
        setSeenKeys({});
      }, 0);
    }
  }, [studentId]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const appointmentNotifications = appointments
      .filter((req) => req.status !== "pending")
      .map((req) => ({
        key: `${req.id}:${req.status}`,
        title: statusTitle(req.status),
        message: statusMessage(req),
        createdAt: req.submittedAt,
        kind: "appointment" as const,
        status: req.status,
        requestId: req.id,
        href: `/requests?filter=${encodeURIComponent(req.status)}&requestId=${encodeURIComponent(req.id)}`,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const broadcastNotifications = broadcasts.map((note) => ({
      key: `broadcast:${note.id}`,
      title: note.title,
      message: note.message,
      createdAt: note.createdAt,
      kind: "broadcast" as const,
      href: "/dashboard",
      attachmentName: note.attachmentName,
      attachmentPath: note.attachmentPath,
      attachmentMimeType: note.attachmentMimeType,
    }));

    return [...appointmentNotifications, ...broadcastNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [appointments, broadcasts]);

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
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1 text-sm font-semibold text-foreground">
                  Notifications
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-2 py-5 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 8).map((note) => (
                  <DropdownMenuItem
                    key={note.key}
                    className="items-start gap-2 rounded-lg px-2 py-2.5"
                    onClick={() => {
                      setMenuOpen(false);
                      if (note.kind === "broadcast") {
                        setSelectedBroadcast(note);
                        return;
                      }
                      router.push(note.href);
                    }}
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
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/requests");
                }}
                className="w-full px-2 py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open <span className="font-semibold text-foreground">Appointment Requests</span> page
                to view complete details.
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border-l border-neutral-200 pl-2 sm:pl-3 cursor-pointer">
            <ProfileMenu />
          </div>
        </div>
      </div>
      {selectedBroadcast ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setSelectedBroadcast(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-background p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{selectedBroadcast.title}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedBroadcast(null)}>
                Close
              </Button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{selectedBroadcast.message}</p>
            {selectedBroadcast.attachmentPath ? (
              selectedBroadcast.attachmentMimeType?.startsWith("image/") ? (
                <img
                  src={selectedBroadcast.attachmentPath}
                  alt={selectedBroadcast.attachmentName || "Notification attachment"}
                  className="max-h-[65vh] w-full rounded-lg border border-border object-contain"
                />
              ) : selectedBroadcast.attachmentMimeType === "application/pdf" ? (
                <iframe
                  src={selectedBroadcast.attachmentPath}
                  title={selectedBroadcast.attachmentName || "Notification PDF"}
                  className="h-[70vh] w-full rounded-lg border border-border"
                />
              ) : (
                <a
                  href={selectedBroadcast.attachmentPath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Open attachment
                </a>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
