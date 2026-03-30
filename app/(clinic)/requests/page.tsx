import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BackToHome } from "@/components/clinic/back-to-home";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MOCK_APPOINTMENT_REQUESTS,
  type RequestStatus,
} from "@/lib/clinic/mock-requests";
import { cn } from "@/lib/utils";

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusBadge: Record<
  RequestStatus,
  string
> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-green-600 bg-green-600 text-white",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

export default function RequestsPage() {
  const items = MOCK_APPOINTMENT_REQUESTS;

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
          <StatusPill active label="All" />
          <StatusPill label="Pending" />
          <StatusPill label="Approved" />
          <StatusPill label="Rejected" />
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          All appointment requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full details for each appointment request you have submitted to the
          clinic.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No data yet</p>
            <p>
              You have not submitted any appointment requests. Use Reserve
              appointment to send one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((req) => (
            <li key={req.id}>
              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Request ID
                    </p>
                    <CardTitle className="text-base font-mono text-foreground">
                      {req.id}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0", statusBadge[req.status])}
                  >
                    {statusLabels[req.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-sm">
                  <DetailRow label="Student" value={req.studentName} />
                  <DetailRow label="Email" value={req.email} />
                  <DetailRow label="Address" value={req.address} />
                  <Separator />
                  <DetailRow label="Reason" value={req.reason} />
                  <DetailRow
                    label="Requested date"
                    value={req.requestedDate}
                  />
                  <DetailRow
                    label="Submitted"
                    value={new Date(req.submittedAt).toLocaleString()}
                  />
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}

/** Visual-only pills (no filtering or navigation). */
function StatusPill({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium select-none",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground"
      )}
    >
      {label}
    </span>
  );
}
