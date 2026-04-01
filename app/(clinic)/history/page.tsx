import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { HomeLink } from "@/components/clinic/home-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type HistoryStatus = "completed" | "cancelled" | "no-show";

type HistoryEntry = {
  id: string;
  status: HistoryStatus;
  appointmentDate: string;
  completedAt?: string;
  reason: string;
  outcome: string;
  clinicNote?: string;
};

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "HST-2026-0089",
    status: "completed",
    appointmentDate: "Monday, March 10, 2026 — 9:00 AM",
    completedAt: "2026-03-10T09:45:00.000Z",
    reason: "Consultation (general check-up)",
    outcome: "No issues found. Advised to maintain healthy habits.",
    clinicNote: "Patient in good health. Follow-up in 6 months if needed.",
  },
  {
    id: "HST-2026-0076",
    status: "completed",
    appointmentDate: "Wednesday, February 26, 2026 — 2:00 PM",
    completedAt: "2026-02-26T14:30:00.000Z",
    reason: "Medical certification",
    outcome: "Certificate issued for PE exemption.",
    clinicNote: "Medical certificate provided. Valid for 1 semester.",
  },
  {
    id: "HST-2026-0061",
    status: "cancelled",
    appointmentDate: "Friday, February 14, 2026 — 10:30 AM",
    reason: "Follow-up",
    outcome: "Appointment cancelled by student.",
    clinicNote: "Student requested cancellation due to schedule conflict.",
  },
  {
    id: "HST-2026-0045",
    status: "no-show",
    appointmentDate: "Tuesday, January 28, 2026 — 3:00 PM",
    reason: "Consultation (general check-up)",
    outcome: "Student did not arrive for appointment.",
  },
  {
    id: "HST-2026-0032",
    status: "completed",
    appointmentDate: "Thursday, January 16, 2026 — 11:00 AM",
    completedAt: "2026-01-16T11:25:00.000Z",
    reason: "Others — vaccination records update",
    outcome: "Records updated in system.",
    clinicNote: "Immunization records synchronized with student portal.",
  },
];

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

export default function HistoryPage() {
  const completedCount = MOCK_HISTORY.filter(
    (h) => h.status === "completed"
  ).length;
  const cancelledCount = MOCK_HISTORY.filter(
    (h) => h.status === "cancelled"
  ).length;
  const noShowCount = MOCK_HISTORY.filter(
    (h) => h.status === "no-show"
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-0 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review dates, reasons, and outcomes of past clinic visits.
        </p>
      </div>

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
              <p className="text-2xl font-bold text-foreground">{noShowCount}</p>
              <p className="text-xs text-muted-foreground">No Show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past Appointments */}
      {MOCK_HISTORY.length === 0 ? (
        <>
          <div className="flex items-center pb-4 justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Past appointments
              </h2>
              <span className="text-sm text-muted-foreground">
                {MOCK_HISTORY.length} total
              </span>
            </div>
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No history yet</p>
              <p>
                Completed and past clinic visits will appear here after your
                appointments are finished.
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
              {MOCK_HISTORY.length} total
            </span>
          </div>
          <ul className="flex flex-col gap-4">
            {MOCK_HISTORY.map((entry) => {
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
                        <DetailRow label="Reason" value={entry.reason} />
                        <DetailRow label="Outcome" value={entry.outcome} />

                        {entry.completedAt ? (
                          <DetailRow
                            label="Completed at"
                            value={new Date(entry.completedAt).toLocaleString()}
                          />
                        ) : null}
                      </div>

                      {entry.clinicNote ? (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Clinic note
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