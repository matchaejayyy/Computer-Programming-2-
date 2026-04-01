"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackToHome } from "@/components/clinic/back-to-home";
import { HomeLink } from "@/components/clinic/home-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AppointmentRequest, RequestStatus } from "@/lib/clinic/mock-requests";
import { cn } from "@/lib/utils";

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

const filterEndpointByStatus: Record<RequestStatus, string> = {
  pending: "/api/filter-pending",
  approved: "/api/filter-accepted",
  rejected: "/api/filter-rejected",
};

export function RequestsContent({ initialRequests }: Props) {
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filteredItems, setFilteredItems] = useState(initialRequests);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  useEffect(() => {
    const rawFilter = searchParams.get("filter");
    if (
      rawFilter === "pending" ||
      rawFilter === "approved" ||
      rawFilter === "rejected" ||
      rawFilter === "all"
    ) {
      setActiveFilter(rawFilter);
    }
  }, [searchParams]);

  // Active filter effect
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
  const filterButtonClass = (name: "all" | "pending" | "approved" | "rejected") =>
    cn(
      "min-w-24 cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
      activeFilter === name
        ? "border-[#E50000] bg-[#E50000] text-white shadow-sm"
        : "border-border bg-background text-foreground hover:bg-muted hover:-translate-y-0.5"
    );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
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
</div>
</div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full details for each appointment request you have submitted to the clinic.
        </p>
      </div>

      {filterError ? (
        <p className="text-sm text-destructive" role="alert">{filterError}</p>
      ) : null}

      <section
        className={cn(
          "min-h-[60vh] transition-all duration-300",
          filterLoading ? "translate-y-1 opacity-70" : "translate-y-0 opacity-100"
        )}
      >
      {initialRequests.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No data yet</p>
            <p>You have not submitted any appointment requests. Use Reserve appointment to send one.</p>
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
      </section>

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