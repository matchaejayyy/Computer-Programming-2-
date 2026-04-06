"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { HomeLink } from "@/components/clinic/home-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useClinicStudentId } from "@/components/clinic/clinic-student-bridge";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";
import { cn } from "@/lib/utils";

const statusLabels: Record<RequestStatus, string> = {
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

type Props = {
  studentId?: string;
};

const filterEndpointByStatus: Record<RequestStatus, string> = {
  pending: "/api/filter-pending",
  approved: "/api/filter-accepted",
  rejected: "/api/filter-rejected",
  cancelled: "/api/filter-cancelled",
  no_show: "/api/filter-no-show",
};

export function RequestsContent({ studentId: studentIdProp }: Props) {
  const fromContext = useClinicStudentId();
  const studentId = studentIdProp ?? fromContext;
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "cancelled" | "no_show"
  >("all");
  const [initialRequests, setInitialRequests] = useState<AppointmentRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState<AppointmentRequest[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [cancelOpenForId, setCancelOpenForId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("schedule_conflict");
  const [cancelOtherNote, setCancelOtherNote] = useState("");
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const cancelReasonOptions = [
    { value: "schedule_conflict", label: "Schedule conflict" },
    { value: "already_resolved", label: "Concern already resolved" },
    { value: "not_available", label: "Not available" },
    { value: "others", label: "Others" },
  ] as const;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!studentId) {
        setDataLoading(false);
        setInitialRequests([]);
        setDataError("Sign in as a student to view your requests.");
        return;
      }
      setDataLoading(true);
      setDataError(null);
      try {
        const res = await fetch(
          `/api/clinic-requests?studentId=${encodeURIComponent(studentId)}`
        );
        const body = (await res.json()) as {
          appointments?: AppointmentRequest[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error || "Failed to load requests.");
        }
        if (!cancelled) {
          setInitialRequests(Array.isArray(body.appointments) ? body.appointments : []);
        }
      } catch (e) {
        if (!cancelled) {
          setDataError(e instanceof Error ? e.message : "Could not load requests.");
          setInitialRequests([]);
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    const rawFilter = searchParams.get("filter");
    if (
      rawFilter === "pending" ||
      rawFilter === "approved" ||
      rawFilter === "rejected" ||
      rawFilter === "cancelled" ||
      rawFilter === "no_show" ||
      rawFilter === "all"
    ) {
      setActiveFilter(rawFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    const applyFilter = async () => {
      if (activeFilter === "all") {
        setFilteredItems(initialRequests);
        setFilterError(null);
        setFilterLoading(false);
        return;
      }

      const statuses = initialRequests.map((r) => r.status);
      setFilterLoading(true);
      setFilterError(null);
      try {
        const res = await fetch(filterEndpointByStatus[activeFilter], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statuses }),
        });
        if (!res.ok) {
          throw new Error("Filter request failed");
        }
        const data = (await res.json()) as { indices?: number[] };
        const indices = Array.isArray(data.indices) ? data.indices : [];
        setFilteredItems(indices.map((i) => initialRequests[i]).filter(Boolean));
      } catch {
        setFilterError("Could not apply C++ filter. Showing fallback results.");
        setFilteredItems(initialRequests.filter((r) => r.status === activeFilter));
      } finally {
        setFilterLoading(false);
      }
    };

    void applyFilter();
  }, [activeFilter, initialRequests]);

  const items = filteredItems;
  const title = "Appointment requests";
  const filterButtonClass = (
    name: "all" | "pending" | "approved" | "rejected" | "cancelled" | "no_show"
  ) =>
    cn(
      "min-w-24 cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
      activeFilter === name
        ? "border-[#E50000] bg-[#E50000] text-white shadow-sm"
        : "border-border bg-background text-foreground hover:bg-muted hover:-translate-y-0.5"
    );

  async function reloadRequests() {
    if (!studentId) return;
    const res = await fetch(`/api/clinic-requests?studentId=${encodeURIComponent(studentId)}`);
    const body = (await res.json()) as {
      appointments?: AppointmentRequest[];
      error?: string;
    };
    if (!res.ok) {
      throw new Error(body.error || "Failed to load requests.");
    }
    setInitialRequests(Array.isArray(body.appointments) ? body.appointments : []);
  }

  async function submitCancel(req: AppointmentRequest) {
    const fallbackUpdateId =
      req.updateId ??
      (() => {
        const m = /REQ-(\d+)/i.exec(req.id);
        if (!m) return undefined;
        const n = Number(m[1]);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      })();
    if (!fallbackUpdateId) {
      setCancelError("Cannot cancel this appointment (missing ID).");
      return;
    }
    if (cancelReason === "others" && !cancelOtherNote.trim()) {
      setCancelError("Please provide a note for Others.");
      return;
    }
    setCancelLoadingId(req.id);
    setCancelError(null);
    try {
      const res = await fetch("/api/clinic-requests/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateId: fallbackUpdateId,
          reason: cancelReason,
          otherNote: cancelOtherNote.trim(),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || "Failed to cancel appointment.");
      }
      await reloadRequests();
      setCancelOpenForId(null);
      setCancelOtherNote("");
      setCancelReason("schedule_conflict");
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : "Failed to cancel appointment.");
    } finally {
      setCancelLoadingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={filterButtonClass("all")}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("pending")}
            className={filterButtonClass("pending")}
          >
            Pending
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("approved")}
            className={filterButtonClass("approved")}
          >
            Approved
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("rejected")}
            className={filterButtonClass("rejected")}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("cancelled")}
            className={filterButtonClass("cancelled")}
          >
            Cancelled
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("no_show")}
            className={filterButtonClass("no_show")}
          >
            No Show
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full details for each appointment request you have submitted to the clinic.
        </p>
      </div>

      

      {filterError ? (
        <p className="text-sm text-destructive" role="alert">
          {filterError}
        </p>
      ) : null}

      <section
        className={cn(
          "min-h-[60vh] transition-all duration-300",
          filterLoading ? "translate-y-1 opacity-70" : "translate-y-0 opacity-100"
        )}
      >
        {dataLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Loading your requests…</p>
            </CardContent>
          </Card>
        ) : initialRequests.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No data yet</p>
              <p>
                You have not submitted any appointment requests. Use Reserve appointment to send
                one.
              </p>
            </CardContent>
          </Card>
        ) : filterLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Loading filtered requests…</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No matching requests</p>
              <p>There are no requests for the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((req) => (
              <li key={req.id} className="animate-[clinic-page-enter_240ms_ease-out]">
                <Card className="border-border shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Request ID
                      </p>
                      <CardTitle className="text-base font-mono text-foreground">{req.id}</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0", statusBadge[req.status])}>
                      {statusLabels[req.status]}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4 text-sm">
                    <DetailRow label="Student" value={req.studentName} />
                    <DetailRow label="Email" value={req.email} />
                    <DetailRow label="Address" value={req.address} />
                    <Separator />
                    <DetailRow label="Reason" value={req.reason} />
                    <DetailRow label="Requested date" value={req.requestedDate} />
                    <DetailRow label="Submitted" value={new Date(req.submittedAt).toLocaleString()} />
                    {req.clinicNote ? (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Clinic note
                          </p>
                          <p className="mt-1 text-foreground">{req.clinicNote}</p>
                        </div>
                      </>
                    ) : null}
                    {req.status === "pending" ? (
                      <>
                        <Separator />
                        {cancelOpenForId === req.id ? (
                          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                            <p className="text-sm font-medium text-foreground">
                              Cancel pending appointment
                            </p>
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Reason
                              </label>
                              <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-white px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              >
                                {cancelReasonOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {cancelReason === "others" ? (
                              <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Note
                                </label>
                                <textarea
                                  value={cancelOtherNote}
                                  onChange={(e) => setCancelOtherNote(e.target.value)}
                                  rows={3}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  placeholder="Enter your reason"
                                />
                              </div>
                            ) : null}
                            {cancelError ? (
                              <p className="text-sm text-destructive">{cancelError}</p>
                            ) : null}
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => void submitCancel(req)}
                                disabled={cancelLoadingId === req.id}
                                className="rounded-md bg-[#E50000] px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                              >
                                {cancelLoadingId === req.id ? "Cancelling..." : "Confirm cancel"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelOpenForId(null);
                                  setCancelOtherNote("");
                                  setCancelReason("schedule_conflict");
                                  setCancelError(null);
                                }}
                                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelOpenForId(req.id);
                              setCancelError(null);
                              setCancelReason("schedule_conflict");
                              setCancelOtherNote("");
                            }}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Cancel appointment
                          </button>
                        )}
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
