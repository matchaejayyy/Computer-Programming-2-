/** Allowed school domain for student portal (Google + password login). */
export const STUDENT_EMAIL_DOMAIN = "@usa.edu.ph";

export function isAllowedStudentEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(STUDENT_EMAIL_DOMAIN);
}
