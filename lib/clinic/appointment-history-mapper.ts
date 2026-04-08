import type { Appointment, AppointmentStatus } from "@prisma/client";

import type { StoredAppointment } from "@/lib/clinic/appointment-records";
import { toAppointmentRequestView } from "@/lib/clinic/appointment-records";
import type { RequestStatus } from "@/lib/clinic/mock-requests";

export type HistoryStatus =
  | "pending"
  | "completed"
  | "confirmed"
  | "cancelled-by-you"
  | "rejected"
  | "no-show";

export type HistoryEntry = {
  id: string;
  status: HistoryStatus;
  appointmentDate: string;
  studentName: string;
  completedAt?: string;
  reason: string;
  outcome: string;
  clinicNote?: string;
};

function historyStatusFromRequestStatus(s: RequestStatus): HistoryStatus {
  if (s === "approved") return "confirmed";
  if (s === "cancelled") return "cancelled-by-you";
  if (s === "no_show") return "no-show";
  return s;
}

function historyStatusFromAppointment(s: AppointmentStatus): HistoryStatus {
  if (s === "pending") return "pending";
  if (s === "completed") return "completed";
  if (s === "approved") return "confirmed";
  if (s === "cancelled") return "cancelled-by-you";
  if (s === "no_show") return "no-show";
  if (s === "rejected") return "rejected";
  return "pending";
}

function displayReason(a: Appointment): string {
  if (a.reason === "others" && a.otherReasonDetail.trim()) {
    return `Others — ${a.otherReasonDetail.trim()}`;
  }
  return a.reason;
}

function outcomeFromRequestStatus(s: RequestStatus, adminNote: string): string {
  const note = adminNote.trim();
  const map: Record<RequestStatus, string> = {
    pending: "Appointment request is pending review.",
    approved: "Appointment approved. Attend on your scheduled date.",
    completed: note || "Visit completed.",
    rejected: note || "Appointment request was rejected.",
    cancelled: note || "Appointment was cancelled by the student.",
    no_show: note || "Student did not arrive on appointment day.",
  };
  return map[s];
}

/**
 * Same status and fields as "My requests" — uses {@link toAppointmentRequestView} rules.
 * Call after {@link readAllStoredAppointments} so the on-disk store matches Prisma.
 */
export function storedAppointmentToHistoryEntry(item: StoredAppointment): HistoryEntry {
  const v = toAppointmentRequestView(item);
  const status = historyStatusFromRequestStatus(v.status);
  const { record, updateId } = item;
  const idNum = typeof record.id === "number" ? record.id : updateId;
  const adminNote = record.adminNote ?? "";
  return {
    id: `HST-${String(idNum).padStart(4, "0")}`,
    status,
    appointmentDate: v.requestedDate,
    studentName: v.studentName,
    completedAt: v.status !== "pending" ? v.submittedAt : undefined,
    reason: v.reason,
    outcome: outcomeFromRequestStatus(v.status, adminNote),
    clinicNote: adminNote.trim() || undefined,
  };
}

export function appointmentToHistoryEntry(a: Appointment): HistoryEntry {
  const status = historyStatusFromAppointment(a.status);
  const reason = displayReason(a);
  const outcomeMap: Record<AppointmentStatus, string> = {
    approved: "Appointment approved. Attend on your scheduled date.",
    completed: a.adminNote.trim() || "Visit completed.",
    rejected: a.adminNote.trim() || "Appointment request was rejected.",
    cancelled: a.adminNote.trim() || "Appointment was cancelled by the student.",
    no_show: a.adminNote.trim() || "Student did not arrive on appointment day.",
    pending: "Appointment request is pending review.",
  };

  return {
    id: `HST-${String(a.id).padStart(4, "0")}`,
    status,
    appointmentDate: `${a.preferredDate} — ${a.preferredTime}`,
    studentName: a.studentName,
    completedAt: a.status !== "pending" ? a.submittedAt.toISOString() : undefined,
    reason,
    outcome: outcomeMap[a.status],
    clinicNote: a.adminNote.trim() || undefined,
  };
}
