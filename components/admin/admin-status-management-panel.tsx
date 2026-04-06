"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Activity, Ban, CheckCircle, ChevronRight, LayoutGrid, XCircle } from "lucide-react";

import { HomeLink } from "@/components/admin/admin-homelink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";
import { cn } from "@/lib/utils";

type Row = AppointmentRequest & { updateId: number };

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled" | "no_show";

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const filterButtonLabels: Record<StatusFilter, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const statusBadge: Record<RequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-green-600 bg-green-600 text-white",
  rejected: "border-red-200 bg-red-50 text-red-800",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  no_show: "border-red-300 bg-red-100 text-red-900",
};

export function AdminStatusManagementPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    no_show: 0,
  });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const statRes = await fetch("/api/admin-stats");
      const statData = (await statRes.json()) as typeof stats;
      if (statRes.ok && statData && typeof statData.total === "number") {
        setStats(statData);
      }
    } catch {
      /* stats optional */
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = debouncedSearch.trim();
      const url = q
        ? `/api/admin/appointments?filter=${filter}&q=${encodeURIComponent(q)}`
        : `/api/admin/appointments?filter=${filter}`;
      const apptRes = await fetch(url);
      const apptData = (await apptRes.json()) as { appointments?: Row[]; error?: string };
      if (!apptRes.ok) {
        throw new Error(apptData.error || "Failed to load");
      }
      setRows(Array.isArray(apptData.appointments) ? apptData.appointments : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Status management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose All or a status, then search by reference, name, or school ID. The server uses C++
            to list and search appointments when the native binaries are built.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
              <LayoutGrid className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">All statuses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Activity className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Still waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <XCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Turned down</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Ban className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled by student</p>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-border shadow-sm">
          <CardContent className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-8 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <Activity className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.no_show}</p>
              <p className="text-xs text-muted-foreground">No show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4 border border-border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <Label className="text-sm font-medium">Filter by:</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "pending", "approved", "rejected", "cancelled", "no_show"] as const).map((name) => (
              <Button
                key={name}
                type="button"
                variant={filter === name ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(name)}
                className="min-h-10 sm:min-h-9"
              >
                {filterButtonLabels[name]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Loading</p>
            <p>One moment…</p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {debouncedSearch.trim() !== ""
                ? "No matching appointments"
                : "Nothing in this list"}
            </p>
            <p>
              {debouncedSearch.trim() !== ""
                ? "Try another reference, name, or school ID, or clear the search box."
                : filter === "all"
                  ? "There are no appointments on record."
                  : filter === "pending"
                    ? "No appointments are waiting for a decision."
                    : filter === "approved"
                      ? "No confirmed appointments match this filter."
                      : filter === "rejected"
                        ? "No declined appointments match this filter."
                        : filter === "cancelled"
                          ? "No cancelled appointments match this filter."
                          : "No no-show appointments match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 p-4 sm:p-5">
              <Label htmlFor="admin-status-search" className="text-sm font-medium">
                Search in this list
              </Label>
              <Input
                id="admin-status-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Reference, student name, or school ID"
                className="max-w-xl"
                autoComplete="off"
              />
            </CardContent>
          </Card>
        <ul className="flex flex-col gap-4">
          {rows.map((req) => {
            const inner = (
              <>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-4 sm:px-5">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Reference
                    </p>
                    <CardTitle className="break-words font-mono text-base text-foreground">
                      {req.id}
                    </CardTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={cn(statusBadge[req.status])}>
                      {statusLabels[req.status]}
                    </Badge>
                    {req.status === "pending" ? (
                      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 py-4 text-sm sm:px-5">
                  <div className="space-y-3">
                    <DetailRow label="Student name" value={req.studentName} />
                    {req.schoolIdNumber ? (
                      <DetailRow label="School ID" value={req.schoolIdNumber} />
                    ) : null}
                    <DetailRow label="Date and time they asked for" value={req.requestedDate} />
                  </div>
                  {req.clinicNote ? (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Note on file
                        </p>
                        <p className="mt-1 break-words text-foreground">{req.clinicNote}</p>
                      </div>
                    </>
                  ) : null}
                  {(req.status === "approved" || req.status === "no_show") ? (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={req.status === "approved" ? "default" : "outline"}
                          disabled={updatingId === req.updateId}
                          onClick={async () => {
                            setUpdatingId(req.updateId);
                            try {
                              await fetch("/api/admin/appointments", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  updateId: req.updateId,
                                  status: "approved",
                                  adminNote: req.clinicNote ?? "",
                                }),
                              });
                              await loadRows();
                              await loadStats();
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          {updatingId === req.updateId && req.status !== "approved"
                            ? "Saving..."
                            : "Set completed"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={req.status === "no_show" ? "destructive" : "outline"}
                          disabled={updatingId === req.updateId}
                          onClick={async () => {
                            setUpdatingId(req.updateId);
                            try {
                              await fetch("/api/admin/appointments", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  updateId: req.updateId,
                                  status: "no_show",
                                  adminNote:
                                    (req.clinicNote?.trim() || "Marked as no-show by clinic staff."),
                                }),
                              });
                              await loadRows();
                              await loadStats();
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          {updatingId === req.updateId && req.status !== "no_show"
                            ? "Saving..."
                            : "Set no show"}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </>
            );

            if (req.status === "pending") {
              return (
                <li key={req.id}>
                  <Link
                    href={`/admin/requests?updateId=${encodeURIComponent(String(req.updateId))}&returnTo=${encodeURIComponent("status-management")}`}
                    className="block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card className="min-w-0 border-border shadow-sm transition-colors hover:bg-neutral-50/80">
                      {inner}
                    </Card>
                  </Link>
                </li>
              );
            }

            return (
              <li key={req.id}>
                <Card className="min-w-0 border-border shadow-sm">{inner}</Card>
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-foreground">{value}</p>
    </div>
  );
}
