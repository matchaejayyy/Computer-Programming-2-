"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminAppointmentReviewActions } from "@/components/admin/admin-appointment-review-actions";
import { HomeLink } from "@/components/admin/admin-homelink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AppointmentRequest } from "@/lib/clinic/mock-requests";

type Row = AppointmentRequest & { updateId: number };

export function AdminRequestsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusRaw = searchParams.get("updateId");
  const focusUpdateId = useMemo(() => {
    if (focusRaw == null || focusRaw.trim() === "") {
      return null;
    }
    const n = Number(focusRaw);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [focusRaw]);

  const returnToStatusManagement = useMemo(() => {
    return searchParams.get("returnTo")?.trim() === "status-management";
  }, [searchParams]);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const focusRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromStatusDeepLink = focusUpdateId != null;
      const q =
        !fromStatusDeepLink && debouncedSearch.trim() !== ""
          ? `&q=${encodeURIComponent(debouncedSearch.trim())}`
          : "";
      const res = await fetch(`/api/admin/appointments?filter=pending${q}`);
      const data = (await res.json()) as {
        appointments?: Row[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Failed to load");
      }
      setRows(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, focusUpdateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = useMemo(() => {
    if (focusUpdateId == null) {
      return rows;
    }
    return rows.filter((r) => r.updateId === focusUpdateId);
  }, [rows, focusUpdateId]);

  const focusMissing =
    focusUpdateId != null && !loading && !rows.some((r) => r.updateId === focusUpdateId);

  useEffect(() => {
    if (!focusUpdateId || visibleRows.length === 0) {
      return;
    }
    focusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusUpdateId, visibleRows.length, loading]);

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">View request</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review pending requests. You can approve or reject each one and add an optional note for
            the student.
          </p>
        </div>
      </div>

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
      ) : focusMissing ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-4 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">This request isn&apos;t open anymore</p>
            <p>
              It may already be approved or rejected, or the link is outdated. Open status
              management to see all bookings.
            </p>
            <Link
              href="/admin/status-management"
              className="inline-block text-sm font-semibold text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Go to status management
            </Link>
          </CardContent>
        </Card>
      ) : focusUpdateId != null ? (
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Showing one request.{" "}
            <Link
              href="/admin/requests"
              className="font-medium text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Show every open request
            </Link>
          </p>
          <ul className="flex flex-col gap-4">
            {visibleRows.map((req) => (
              <li
                key={req.id}
                ref={req.updateId === focusUpdateId ? focusRef : undefined}
              >
                <RequestCard
                  req={req}
                  load={load}
                  afterDecision={() => {
                    if (returnToStatusManagement) {
                      router.replace("/admin/status-management");
                    } else {
                      router.replace("/admin/requests");
                    }
                    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 p-4 sm:p-5">
              <Label htmlFor="admin-requests-search" className="text-sm font-medium">
                Search
              </Label>
              <Input
                id="admin-requests-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Reference, student name, or school ID"
                className="max-w-xl"
                autoComplete="off"
              />
            </CardContent>
          </Card>
          {rows.length === 0 ? (
            <Card className="border border-border shadow-sm">
              <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {debouncedSearch.trim() !== ""
                    ? "No matching requests"
                    : "No pending requests right now"}
                </p>
                <p>
                  {debouncedSearch.trim() !== ""
                    ? "Try another reference, name, or school ID, or clear the search box."
                    : "When a student sends a new booking, it will show up here until you answer it. Nothing for you to do at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-4">
              {rows.map((req) => (
                <li key={req.id}>
                  <RequestCard
                    req={req}
                    load={load}
                    afterDecision={() => {
                      if (returnToStatusManagement) {
                        router.replace("/admin/status-management");
                      } else {
                        router.replace("/admin/requests");
                      }
                      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  req,
  load,
  afterDecision,
}: {
  req: Row;
  load: () => void | Promise<void>;
  afterDecision: () => void;
}) {
  return (
    <Card className="min-w-0 border-border shadow-sm transition-colors hover:bg-neutral-50/50">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reference
          </p>
          <CardTitle className="break-words font-mono text-base text-foreground">{req.id}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 text-sm sm:px-5">
        <div className="space-y-3">
          <DetailRow label="Student name" value={req.studentName} />
          {req.schoolIdNumber ? <DetailRow label="School ID" value={req.schoolIdNumber} /> : null}
          <DetailRow label="Email" value={req.email} />
          <DetailRow label="Address" value={req.address} />
        </div>

        <Separator />

        <div className="space-y-3">
          <DetailRow label="What they need" value={req.reason} />
          <DetailRow label="Date and time they asked for" value={req.requestedDate} />
          <DetailRow label="Sent in on" value={new Date(req.submittedAt).toLocaleString()} />
        </div>

        {req.clinicNote ? (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your note to them
              </p>
              <p className="mt-1 break-words text-foreground">{req.clinicNote}</p>
            </div>
          </>
        ) : null}

        <AdminAppointmentReviewActions
          updateId={req.updateId}
          status={req.status}
          initialNote={req.clinicNote}
          onUpdated={load}
          afterDecision={afterDecision}
        />
      </CardContent>
    </Card>
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
