import { AdminPatientFinder } from "@/components/admin/appointments/PatientFinder";
import { HomeLink } from "@/components/admin/dashboard/HomeLink";

export default function AdminPatientFinderPage() {
  return (
    <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink href="/admin" label="Back to dashboard" />
      </div>

      <div className="mb-4 min-w-0">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Student registry finder</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Search registered accounts and open any student&apos;s full profile on a dedicated page.
        </p>
      </div>

      <AdminPatientFinder />
    </div>
  );
}
