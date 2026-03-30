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
 * Replace with API data when the backend is ready.
 */
export const MOCK_APPOINTMENT_REQUESTS: AppointmentRequest[] = [
  {
    id: "REQ-2026-0142",
    status: "pending",
    submittedAt: "2026-03-28T09:15:00.000Z",
    requestedDate: "Wednesday, April 2, 2026 — 10:00 AM",
    reason: "Consultation (general check-up)",
    studentName: "Vhea Asesor",
    email: "student@usa.edu.ph",
    address: "Iloilo City, Philippines",
  },
  {
    id: "REQ-2026-0138",
    status: "approved",
    submittedAt: "2026-03-22T14:40:00.000Z",
    requestedDate: "Monday, March 24, 2026 — 2:00 PM",
    reason: "Medical certification",
    studentName: "Vhea Asesor",
    email: "student@usa.edu.ph",
    address: "Iloilo City, Philippines",
    clinicNote:
      "Approved. Please bring your school ID and arrive 10 minutes early.",
  },
  {
    id: "REQ-2026-0110",
    status: "rejected",
    submittedAt: "2026-03-10T11:05:00.000Z",
    requestedDate: "Friday, March 14, 2026 — 9:00 AM",
    reason: "Follow-up",
    studentName: "Vhea Asesor",
    email: "student@usa.edu.ph",
    address: "Iloilo City, Philippines",
    clinicNote:
      "Slot fully booked for that week. Please submit a new request with alternate dates.",
  },
  {
    id: "REQ-2026-0155",
    status: "pending",
    submittedAt: "2026-03-29T16:22:00.000Z",
    requestedDate: "Friday, April 4, 2026 — 3:30 PM",
    reason: "Others — dental referral paperwork",
    studentName: "Vhea Asesor",
    email: "student@usa.edu.ph",
    address: "Iloilo City, Philippines",
  },
];

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
