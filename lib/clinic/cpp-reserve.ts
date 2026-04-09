import { createAppointmentInDb } from "@/lib/clinic/appointment-db";

export type ReserveAppointmentPayload = {
  studentName: string;
  email: string;
  address: string;
  reason: string;
  otherReasonDetail?: string;
  preferredDate: string;
  preferredTime: string;
  schoolIdNumber?: string;
};

/**
 * Persists to PostgreSQL via Prisma, then refreshes the native JSONL file so
 * existing C++ tools (list, search, count) continue to read current data.
 */
export async function reserveAppointmentCpp(
  payload: ReserveAppointmentPayload
): Promise<string> {
  const { id } = await createAppointmentInDb({
    studentName: payload.studentName,
    email: payload.email,
    address: payload.address,
    reason: payload.reason,
    otherReasonDetail: payload.otherReasonDetail,
    preferredDate: payload.preferredDate,
    preferredTime: payload.preferredTime,
    schoolIdNumber: payload.schoolIdNumber,
  });
  return "Your appointment has been submitted successfully! You will be redirected shortly.";
}
