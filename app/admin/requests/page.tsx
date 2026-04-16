import { Suspense } from "react";

import { AdminRequestsPanel } from "@/components/admin/requests/RequestsPanel";

export default function AdminRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AdminRequestsPanel />
    </Suspense>
  );
}
