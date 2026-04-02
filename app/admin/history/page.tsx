"use client";

import { useState, useMemo } from "react";
import { Calendar, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { HomeLink } from "@/components/admin/admin-homelink";
import { MOCK_APPOINTMENT_REQUESTS } from "@/lib/clinic/mock-requests";

function parseDateToISO(dateString: string): string {
  // Parse "Wednesday, April 2, 2026 — 10:00 AM" to "2026-04-02"
  const months: Record<string, string> = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  const match = dateString.match(/(\w+), (\w+) (\d+), (\d+)/);
  if (!match) return "";

  const [, , monthName, day, year] = match;
  const month = months[monthName];
  const dayPadded = day.padStart(2, "0");

  return `${year}-${month}-${dayPadded}`;
}

type HistoryStatus = "completed" | "cancelled" | "no-show";

type HistoryEntry = {
  id: string;
  status: HistoryStatus;
  appointmentDate: string;
  studentName: string;
  completedAt?: string;
  reason: string;
  outcome: string;
  clinicNote?: string;
};

// Transform appointment requests to history entries
function transformToHistory(
  request: (typeof MOCK_APPOINTMENT_REQUESTS)[0],
): HistoryEntry {
  const statusMap: Record<string, HistoryStatus> = {
    approved: "completed",
    rejected: "cancelled",
    pending: "no-show",
  };

  const outcomeMap: Record<string, string> = {
    approved: "Appointment completed successfully.",
    rejected: request.clinicNote || "Appointment request was rejected.",
    pending: "Appointment request is pending review.",
  };

  return {
    id: request.id.replace("REQ", "HST"),
    status: statusMap[request.status],
    appointmentDate: request.requestedDate,
    studentName: request.studentName,
    completedAt: request.status !== "pending" ? request.submittedAt : undefined,
    reason: request.reason,
    outcome: outcomeMap[request.status],
    clinicNote: request.clinicNote,
  };
}

const MOCK_HISTORY: HistoryEntry[] =
  MOCK_APPOINTMENT_REQUESTS.map(transformToHistory);

const statusConfig: Record<
  HistoryStatus,
  { label: string; icon: typeof CheckCircle; badgeClass: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    badgeClass: "border-green-600 bg-green-600 text-white",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
  },
  "no-show": {
    label: "No Show",
    icon: AlertCircle,
    badgeClass: "border-red-200 bg-red-50 text-red-800",
  },
};

export default function AdminHistoryPage() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.filter((entry) => {
      // Date filter - compare ISO formats for accuracy
      if (dateFilter) {
        const entryDateISO = parseDateToISO(entry.appointmentDate);
        if (entryDateISO !== dateFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && entry.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [dateFilter, statusFilter]);

  const completedCount = filteredHistory.filter(
    (h) => h.status === "completed",
  ).length;
  const cancelledCount = filteredHistory.filter(
    (h) => h.status === "cancelled",
  ).length;
  const noShowCount = filteredHistory.filter((h) => h.status === "no-show").length;

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
  };

  return (
    <div className="grid grid-cols-1">
      {/* Back to dashboard button */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Appointment History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review dates, reasons, and outcomes of past clinic visits.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-filter" className="text-sm font-medium">
                Filter by Date
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Filter by Status
              </Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="shrink-0"
            >
              <Filter className="mr-2 size-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {/* Completed */}
        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-5 py-5 px-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {completedCount}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-5 py-5 px-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <XCircle className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {cancelledCount}
              </p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>

        {/* No Show */}
        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-5 py-5 px-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {noShowCount}
              </p>
              <p className="text-xs text-muted-foreground">No Show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Appointments */}
      {filteredHistory.length === 0 ? (
        <>
          <div className="flex items-center pb-4 justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Past appointments
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredHistory.length} total
            </span>
          </div>
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No history found</p>
              <p>
                {dateFilter || statusFilter !== "all"
                  ? "No appointments match your current filters."
                  : "Completed and past clinic visits will appear here after your appointments are finished."}
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Past appointments
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredHistory.length} total
            </span>
          </div>
          <ul className="flex flex-col gap-4">
            {filteredHistory.map((entry) => {
              const config = statusConfig[entry.status];
              const StatusIcon = config.icon;
              return (
                <li key={entry.id}>
                  <Card className="border-border shadow-sm transition-colors hover:bg-neutral-50/50">
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Record ID
                        </p>
                        <CardTitle className="font-mono text-base text-foreground">
                          {entry.id}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 gap-1", config.badgeClass)}
                      >
                        <StatusIcon className="size-3" aria-hidden />
                        {config.label}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 px-5 py-4 text-sm">
                      <div className="flex items-start gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Appointment date
                          </p>
                          <p className="mt-0.5 text-foreground">
                            {entry.appointmentDate}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <DetailRow
                          label="Patient Name"
                          value={entry.studentName}
                        />
                        <DetailRow
                          label="Reason for Visit"
                          value={entry.reason}
                        />
                        <DetailRow label="Status" value={entry.outcome} />

                        {entry.completedAt ? (
                          <DetailRow
                            label="Processed at"
                            value={new Date(entry.completedAt).toLocaleString()}
                          />
                        ) : null}
                      </div>

                      {entry.clinicNote ? (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Admin notes
                            </p>
                            <p className="mt-1 text-foreground">
                              {entry.clinicNote}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}