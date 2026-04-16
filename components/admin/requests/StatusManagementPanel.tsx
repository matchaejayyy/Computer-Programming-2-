"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { HomeLink } from "@/components/admin/dashboard/HomeLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AppointmentRequest } from "@/lib/utils/constants/mock-requests";
import { cn } from "@/lib/utils";

type Row = AppointmentRequest & { updateId: number };

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatSelectedDayLabel(iso: string): string {
  const [y, mo, da] = iso.split("-").map(Number);
  if (!y || !mo || !da) return iso;
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const approvedBadgeClass =
  "border-green-600 bg-green-600 text-white";

export function AdminStatusManagementPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(todayIsoDate);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const params = new URLSearchParams({
        filter: "approved",
        date: appointmentDate,
      });
      if (q) params.set("q", q);
      const apptRes = await fetch(`/api/admin/appointments?${params.toString()}`);
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
  }, [appointmentDate, debouncedSearch]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const dayLabel = useMemo(() => formatSelectedDayLabel(appointmentDate), [appointmentDate]);

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Status management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved appointments only. After the visit, mark each as completed or no show. Students
            cancel approved slots from their own account (cancelled does not appear here). Use the
            date control to view another day; it defaults to today.
          </p>
        </div>
      </div>

      <Card className="mb-4 border border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="status-mgmt-date" className="text-sm font-medium">
              Appointment date
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="status-mgmt-date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full max-w-[220px]"
              />
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                <span>{dayLabel}</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {loading ? "…" : `${rows.length} approved`}
              {!loading ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  on this date
                </span>
              ) : null}
            </p>
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
                : "No approved appointments"}
            </p>
            <p>
              {debouncedSearch.trim() !== ""
                ? "Try another reference, name, or school ID, or clear the search box."
                : "Nothing is scheduled for this date with status approved, or every booking was already marked completed/no show."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 p-4 sm:p-5">
              <Label htmlFor="admin-status-search" className="text-sm font-medium">
                Search on this date
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
            {rows.map((req) => (
              <li key={req.id}>
                <Card className="min-w-0 border-border shadow-sm">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Reference
                      </p>
                      <CardTitle className="break-words font-mono text-base text-foreground">
                        {req.id}
                      </CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={cn(approvedBadgeClass)}>
                        Approved
                      </Badge>
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
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Note on file
                          </p>
                          <p className="mt-1 break-words text-foreground">{req.clinicNote}</p>
                        </div>
                      </>
                    ) : null}
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={updatingId === req.updateId}
                        onClick={async () => {
                          setUpdatingId(req.updateId);
                          try {
                            await fetch("/api/admin/appointments", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                updateId: req.updateId,
                                status: "completed",
                                adminNote:
                                  req.clinicNote?.trim() || "Visit marked completed by clinic staff.",
                              }),
                            });
                            await loadRows();
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        {updatingId === req.updateId ? "Saving…" : "Mark completed"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
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
                                  req.clinicNote?.trim() || "Marked as no-show by clinic staff.",
                              }),
                            });
                            await loadRows();
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                      >
                        {updatingId === req.updateId ? "Saving…" : "Mark no show"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-foreground">{value}</p>
    </div>
  );
}
