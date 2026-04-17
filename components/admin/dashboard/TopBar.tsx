"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminProfileMenu } from "@/components/admin/dashboard/ProfileMenu";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  no_show: number;
  completed: number;
};

type NotificationItem = {
  key: string;
  title: string;
  message: string;
  href: string;
};

export function AdminTopBar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [seenKeys, setSeenKeys] = useState<Record<string, true>>(() => {
    try {
      const raw = localStorage.getItem("admin_notifications_seen");
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, true>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    no_show: 0,
    completed: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin-stats");
        const body = (await res.json()) as Partial<AdminStats>;
        if (!res.ok || cancelled) return;
        setStats({
          total: Number(body.total ?? 0),
          pending: Number(body.pending ?? 0),
          approved: Number(body.approved ?? 0),
          rejected: Number(body.rejected ?? 0),
          cancelled: Number(body.cancelled ?? 0),
          no_show: Number(body.no_show ?? 0),
          completed: Number(body.completed ?? 0),
        });
      } catch {
        if (!cancelled) {
          setStats({
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            no_show: 0,
            completed: 0,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    if (stats.pending > 0) {
      items.push({
        key: `pending:${stats.pending}`,
        title: "Pending requests",
        message: `${stats.pending} appointment request(s) need review.`,
        href: "/admin/requests?filter=pending",
      });
    }
    if (stats.rejected > 0) {
      items.push({
        key: `rejected:${stats.rejected}`,
        title: "Rejected requests",
        message: `${stats.rejected} request(s) were rejected.`,
        href: "/admin/history?filter=rejected",
      });
    }
    if (stats.cancelled > 0) {
      items.push({
        key: `cancelled:${stats.cancelled}`,
        title: "Cancelled requests",
        message: `${stats.cancelled} request(s) were cancelled.`,
        href: "/admin/history?filter=cancelled-by-you",
      });
    }
    if (stats.no_show > 0) {
      items.push({
        key: `no_show:${stats.no_show}`,
        title: "No-show updates",
        message: `${stats.no_show} visit(s) are marked no-show.`,
        href: "/admin/history?filter=no-show",
      });
    }
    if (stats.approved > 0) {
      items.push({
        key: `approved:${stats.approved}`,
        title: "Approved requests",
        message: `${stats.approved} request(s) have been approved.`,
        href: "/admin/history?filter=confirmed",
      });
    }
    return items;
  }, [stats]);

  const unreadCount = notifications.filter((item) => !seenKeys[item.key]).length;

  function markAllAsRead() {
    if (notifications.length === 0) return;
    const next: Record<string, true> = { ...seenKeys };
    for (const item of notifications) {
      next[item.key] = true;
    }
    setSeenKeys(next);
    try {
      localStorage.setItem("admin_notifications_seen", JSON.stringify(next));
    } catch {
      /* ignore storage write errors */
    }
  }

  return (
    <div className="border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Link
          href="/admin"
          className="min-w-0 shrink text-base font-bold tracking-tight text-foreground sm:text-lg"
        >
          USA Medical Services Admin Portal
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
                  No notifications right now.
                </div>
              ) : (
                notifications.slice(0, 8).map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    className="items-start gap-2 rounded-lg px-2 py-2.5"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <div className="mt-1 size-2 rounded-full bg-[#E50000]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/admin/requests");
                }}
                className="w-full px-2 py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open <span className="font-semibold text-foreground">Appointment Requests</span> for
                full details.
              </button>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border-l border-neutral-200 pl-2 sm:pl-3">
            <AdminProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
