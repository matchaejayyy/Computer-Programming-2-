"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { BackToHome } from "@/components/clinic/back-to-home";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";
import { cn } from "@/lib/utils";

import { filterPendingIndicesCpp } from "@/lib/clinic/cpp-pending-filter";
import { filterAcceptedIndicesCpp } from "@/lib/clinic/cpp-accepted-filter";
import { filterRejectedIndicesCpp } from "@/lib/clinic/cpp-rejected-filter";

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusBadge: Record<RequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-green-600 bg-green-600 text-white",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

type Props = {
  initialRequests: AppointmentRequest[];
};

export function RequestsContent({ initialRequests }: Props) {
  const [pendingOnly, setPendingOnly] = useState(false);
  const [pendingItems, setPendingItems] = useState<AppointmentRequest[] | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filteredItems, setFilteredItems] = useState(initialRequests);

  const loadPendingViaCpp = useCallback(async () => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      const statuses = initialRequests.map((r) => r.status);
      const res = await fetch("/api/filter-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuses }),
      });
      if (!res.ok) {
        throw new Error("Filter request failed");
      }
      const data = (await res.json()) as { indices?: number[] };
      const indices = Array.isArray(data.indices) ? data.indices : [];
      setPendingItems(indices.map((i) => initialRequests[i]).filter(Boolean));
    } catch {
      setPendingError("Could not load pending filter. Try again.");
      setPendingItems([]);
    } finally {
      setPendingLoading(false);
    }
  }, [initialRequests]);

  useEffect(() => {
    if (pendingOnly) {
      void loadPendingViaCpp();
    } else {
      setPendingItems(null);
      setPendingError(null);
    }
  }, [pendingOnly, loadPendingViaCpp]);

  // Active filter effect
  useEffect(() => {
    const applyFilter = async () => {
      if (activeFilter === "all") {
        setFilteredItems(initialRequests);
      } else if (activeFilter === "pending") {
        const indices = await filterPendingIndicesCpp(initialRequests.map((r) => r.status));
        setFilteredItems(indices.map((i) => initialRequests[i]));
      } else if (activeFilter === "approved") {
        const indices = await filterAcceptedIndicesCpp(initialRequests.map((r) => r.status));
        setFilteredItems(indices.map((i) => initialRequests[i]));
      } else if (activeFilter === "rejected") {
        const indices = await filterRejectedIndicesCpp(initialRequests.map((r) => r.status));
        setFilteredItems(indices.map((i) => initialRequests[i]));
      }
    };

    void applyFilter();
  }, [activeFilter, initialRequests]);

  const items = pendingOnly ? (pendingItems ?? []) : filteredItems;

  const loadingPending = pendingOnly && pendingLoading && pendingItems === null;

  const showEmpty =
    pendingOnly && !pendingLoading && pendingItems !== null && pendingItems.length === 0;

  const title = pendingOnly ? "Pending appointment requests" : "All appointment requests";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Home
        </Link>
        <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => setActiveFilter("all")}
    className={activeFilter === "all" ? "active" : ""}
  >
    All
  </button>

  <button
    type="button"
    onClick={() => setActiveFilter("pending")}
    className={activeFilter === "pending" ? "active" : ""}
  >
    Pending
  </button>

  <button
    type="button"
    onClick={() => setActiveFilter("approved")}
    className={activeFilter === "approved" ? "active" : ""}
  >
    Approved
  </button>

  <button
    type="button"
    onClick={() => setActiveFilter("rejected")}
    className={activeFilter === "rejected" ? "active" : ""}
  >
    Rejected
  </button>
</div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full details for each appointment request you have submitted to the clinic.
        </p>
      </div>

      {pendingError ? (
        <p className="text-sm text-destructive" role="alert">{pendingError}</p>
      ) : null}

      {initialRequests.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No data yet</p>
            <p>You have not submitted any appointment requests. Use Reserve appointment to send one.</p>
          </CardContent>
        </Card>
      ) : loadingPending ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Loading pending…</p>
          </CardContent>
        </Card>
      ) : showEmpty ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No pending requests</p>
            <p>You do not have any appointment requests in pending status.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((req) => (
            <li key={req.id}>
              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Request ID</p>
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
                  {req.clinicNote && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clinic note</p>
                        <p className="mt-1 text-foreground">{req.clinicNote}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <BackToHome />
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