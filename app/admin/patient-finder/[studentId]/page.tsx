import Link from "next/link";

import { AdminStudentAccountDetails } from "@/components/admin/appointments/StudentAccountDetails";
import { HomeLink } from "@/components/admin/dashboard/HomeLink";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function AdminStudentAccountPage({ params }: PageProps) {
  const { studentId: encoded } = await params;
  const studentId = decodeURIComponent(encoded);

  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <HomeLink href="/admin" label="Dashboard" />
        <span className="text-muted-foreground" aria-hidden>
          ·
        </span>
        <Link
          href="/admin/patient-finder"
          className="inline-flex w-fit items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Student finder
        </Link>
      </div>

      <div className="mb-4 min-w-0">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Account details</h1>
        <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{studentId}</p>
      </div>

      <Card className="w-full min-w-0 border border-border shadow-sm">
        <CardContent className="w-full min-w-0 p-4 sm:p-5 md:p-6">
          <AdminStudentAccountDetails studentId={studentId} />
        </CardContent>
      </Card>
    </div>
  );
}
