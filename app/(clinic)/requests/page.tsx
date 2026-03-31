import { RequestsContent } from "@/components/clinic/requests-content";
import { MOCK_APPOINTMENT_REQUESTS } from "@/lib/clinic/mock-requests";

export default function RequestsPage() {
  return <RequestsContent initialRequests={MOCK_APPOINTMENT_REQUESTS} />;
}


useEffect(() => {
  const applyFilter = async () => {
    if (activeFilter === "all") {
      setFilteredItems(initialRequests);
    } else if (activeFilter === "pending") {
      const indices = await filterPendingIndicesCpp(initialRequests.map(r => r.status));
      setFilteredItems(indices.map(i => initialRequests[i]));
    } else if (activeFilter === "approved") {  // Adjust to "accepted" if that's your status
      const indices = await filterAcceptedIndicesCpp(initialRequests.map(r => r.status));
      setFilteredItems(indices.map(i => initialRequests[i]));
    } else if (activeFilter === "rejected") {
      const indices = await filterRejectedIndicesCpp(initialRequests.map(r => r.status));  // From your new file
      setFilteredItems(indices.map(i => initialRequests[i]));
    }
  };
  applyFilter();
}, [activeFilter, initialRequests]);

// In the JSX, change spans to buttons:
<button onClick={() => setActiveFilter("pending")} className={activeFilter === "pending" ? "active" : ""}>Pending</button>
<button onClick={() => setActiveFilter("approved")} className={activeFilter === "approved" ? "active" : ""}>Approved</button>
<button onClick={() => setActiveFilter("rejected")} className={activeFilter === "rejected" ? "active" : ""}>Rejected</button>

// Then render filteredItems instead of items in your list.