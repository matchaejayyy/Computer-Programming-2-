export type RequestStatus = "pending" | "approved" | "rejected";

export type AppointmentRequest = {
  id: string;
  status: RequestStatus;
  submittedAt: string;
  requestedDate: string;
  reason: string;
  studentName: string;
  email: string;
  address: string;
  clinicNote?: string;
};

/**
 * Appointment requests for the sidebar counts and /requests page.
 * Empty until your backend supplies data.
 */
export const MOCK_APPOINTMENT_REQUESTS: AppointmentRequest[] = [];

export function countRequestsByStatus() {
  return {
    pending: MOCK_APPOINTMENT_REQUESTS.filter((r) => r.status === "pending")
      .length,
    approved: MOCK_APPOINTMENT_REQUESTS.filter((r) => r.status === "approved")
      .length,
    rejected: MOCK_APPOINTMENT_REQUESTS.filter((r) => r.status === "rejected")
      .length,
  };
}

export function isRequestStatus(
  value: string | undefined
): value is RequestStatus {
  return (
    value === "pending" || value === "approved" || value === "rejected"
  );
}
