import { Suspense } from "react";

import { RequestsContent } from "@/components/clinic/requests-content";

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-muted-foreground">Loading requests…</div>
      }
    >
      <RequestsContent studentId="student@usa.edu.ph" />
    </Suspense>
  );
}
