/** Client-side filter for admin lists: reference, record id, student name, school ID. */

export type AdminSearchableAppointment = {
  id: string;
  updateId: number;
  studentName: string;
  schoolIdNumber?: string;
};

export function appointmentMatchesSearch(
  row: AdminSearchableAppointment,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return true;
  }

  if (row.id.toLowerCase().includes(q)) {
    return true;
  }

  if (String(row.updateId).includes(q)) {
    return true;
  }

  if (row.studentName.toLowerCase().includes(q)) {
    return true;
  }

  const sid = row.schoolIdNumber?.trim().toLowerCase();
  if (sid && sid.includes(q)) {
    return true;
  }

  const digitsOnly = q.replace(/\D/g, "");
  if (digitsOnly.length > 0) {
    const refDigits = row.id.replace(/\D/g, "");
    if (refDigits.includes(digitsOnly)) {
      return true;
    }
    const sidDigits = row.schoolIdNumber?.replace(/\D/g, "") ?? "";
    if (sidDigits.includes(digitsOnly)) {
      return true;
    }
  }

  return false;
}
