import { RequestsContent } from "@/components/clinic/requests-content";
import { MOCK_APPOINTMENT_REQUESTS } from "@/lib/clinic/mock-requests";

export default function RequestsPage() {
  return <RequestsContent initialRequests={MOCK_APPOINTMENT_REQUESTS} />;
}
