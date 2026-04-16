/** Stored in DB for fields the student has not filled yet (Google-created accounts). */
export const PROFILE_PLACEHOLDER = "Not set";

/** Default row for new `StudentProfile` (email, Google, or missing legacy users). */
export const DEFAULT_STUDENT_PROFILE_DATA = {
  birthday: PROFILE_PLACEHOLDER,
  gender: PROFILE_PLACEHOLDER,
  symptomsOrCondition: PROFILE_PLACEHOLDER,
  contactNumber: PROFILE_PLACEHOLDER,
  schoolIdNumber: PROFILE_PLACEHOLDER,
  address: "",
} as const;

export function isProfileFieldUnset(value: string | undefined | null): boolean {
  const t = (value ?? "").trim();
  return t === "" || t === PROFILE_PLACEHOLDER;
}

/** Birthday unset or not a real calendar date yet. */
export function isBirthdayUnset(birthday: string | undefined | null): boolean {
  if (isProfileFieldUnset(birthday)) return true;
  const d = new Date(birthday!.trim());
  return Number.isNaN(d.getTime());
}
