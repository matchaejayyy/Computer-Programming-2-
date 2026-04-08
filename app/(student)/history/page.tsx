import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomeLink } from "@/components/clinic/home-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { HistoryEntry, HistoryStatus } from "@/lib/clinic/appointment-history-mapper";
import { storedAppointmentToHistoryEntry } from "@/lib/clinic/appointment-history-mapper";
import { readAllStoredAppointments } from "@/lib/clinic/appointment-records";
import { getStudentProfile } from "@/lib/clinic/profile-store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type VisibleHistoryStatus = "completed" | "cancelled-by-you" | "rejected" | "no-show";

function isVisibleHistoryStatus(s: HistoryStatus): s is VisibleHistoryStatus {
  return (
    s === "completed" ||
    s === "cancelled-by-you" ||
    s === "rejected" ||
    s === "no-show"
  );
}

const statusConfig: Record<
  VisibleHistoryStatus,
  { label: string; icon: typeof CheckCircle; badgeClass: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    badgeClass: "border-green-600 bg-green-600 text-white",
  },
  "cancelled-by-you": {
    label: "Cancelled by you",
    icon: XCircle,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    badgeClass: "border-red-200 bg-red-50 text-red-800",
  },
  "no-show": {
    label: "No Show",
    icon: AlertCircle,
    badgeClass: "border-red-200 bg-red-50 text-red-800",
  },
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "STUDENT") {
    redirect("/login");
  }
  const profileLookup = session.user.studentId ?? session.user.email;

  const profile = await getStudentProfile(profileLookup);
  if (!profile) {
    redirect("/login");
  }

  const email = profile.email.trim().toLowerCase();
  const all = await readAllStoredAppointments();
  const rows = all
    .filter(({ record }) => record.email.trim().toLowerCase() === email)
    .sort((a, b) => {
      const ta = new Date(a.record.submittedAt ?? 0).getTime();
      const tb = new Date(b.record.submittedAt ?? 0).getTime();
      return tb - ta;
    });
  const history: HistoryEntry[] = rows.map(storedAppointmentToHistoryEntry);
  const pastAppointments = history.filter(
    (h): h is HistoryEntry & { status: VisibleHistoryStatus } =>
      isVisibleHistoryStatus(h.status)
  );

  const completedCount = history.filter((h) => h.status === "completed").length;
  const cancelledByYouCount = history.filter((h) => h.status === "cancelled-by-you").length;
  const rejectedCount = history.filter((h) => h.status === "rejected").length;
  const noShowCount = history.filter((h) => h.status === "no-show").length;

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review dates, reasons, and outcomes of past clinic visits.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground sm:text-2xl">{completedCount}</p>
              <p className="text-xs leading-tight text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <XCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground sm:text-2xl">{cancelledByYouCount}</p>
              <p className="text-xs leading-tight text-muted-foreground">Cancelled by you</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground sm:text-2xl">{rejectedCount}</p>
              <p className="text-xs leading-tight text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground sm:text-2xl">{noShowCount}</p>
              <p className="text-xs leading-tight text-muted-foreground">No Show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pastAppointments.length === 0 ? (
        <>
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-lg font-bold text-foreground">Past appointments</h2>
            <span className="text-sm text-muted-foreground">0 total</span>
          </div>
          <Card className="border border-border shadow-sm">
            <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No history yet</p>
              <p>
                Completed and past clinic visits will appear here after your appointments are finished.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Past appointments</h2>
            <span className="text-sm text-muted-foreground">{pastAppointments.length} total</span>
          </div>
          <ul className="flex flex-col gap-4">
            {pastAppointments.map((entry) => {
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
                      <Badge variant="outline" className={cn("shrink-0 gap-1", config.badgeClass)}>
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
                          <p className="mt-0.5 text-foreground">{entry.appointmentDate}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <DetailRow label="Student Name" value={entry.studentName} />
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
                            <p className="mt-1 text-foreground">{entry.clinicNote}</p>
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
