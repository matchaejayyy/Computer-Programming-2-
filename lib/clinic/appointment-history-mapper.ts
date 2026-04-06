import type { Appointment, AppointmentStatus } from "@prisma/client";

export type HistoryStatus = "completed" | "cancelled-by-you" | "rejected" | "no-show";

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

function historyStatusFromAppointment(s: AppointmentStatus): HistoryStatus {
  if (s === "approved") return "completed";
  if (s === "cancelled") return "cancelled-by-you";
  if (s === "no_show") return "no-show";
  if (s === "rejected") return "rejected";
  return "no-show";
}

function displayReason(a: Appointment): string {
  if (a.reason === "others" && a.otherReasonDetail.trim()) {
    return `Others — ${a.otherReasonDetail.trim()}`;
  }
  return a.reason;
}

export function appointmentToHistoryEntry(a: Appointment): HistoryEntry {
  const status = historyStatusFromAppointment(a.status);
  const reason = displayReason(a);
  const outcomeMap: Record<AppointmentStatus, string> = {
    approved: "Appointment completed successfully.",
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
