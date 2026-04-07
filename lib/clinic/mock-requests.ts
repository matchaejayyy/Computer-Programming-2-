export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled" | "no_show";

export type AppointmentRequest = {
  id: string;
  updateId?: number;
  status: RequestStatus;
  submittedAt: string;
  requestedDate: string;
  reason: string;
  studentName: string;
  email: string;
  address: string;
  clinicNote?: string;
  schoolIdNumber?: string;
};

export function isRequestStatus(
  value: string | undefined
): value is RequestStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled" ||
    value === "no_show"
  );
}
