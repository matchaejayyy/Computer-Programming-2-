import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type StudentProfile = {
  studentId: string;
  name: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
  contactNumber: string;
  email: string;
  schoolIdNumber: string;
  birthdayEdited: boolean;
  genderEdited: boolean;
};

const profileDir = join(process.cwd(), "native", "profile");
const profilePath = join(profileDir, "student-profiles.json");

function ensureProfileDir() {
  if (!existsSync(profileDir)) {
    mkdirSync(profileDir, { recursive: true });
  }
}

function readAllProfiles(): StudentProfile[] {
  if (!existsSync(profilePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(profilePath, "utf8")) as StudentProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Stored profiles only — does not create defaults (safe for admin listing). */
export function listStoredStudentProfiles(): StudentProfile[] {
  return readAllProfiles();
}

function writeAllProfiles(profiles: StudentProfile[]) {
  ensureProfileDir();
  writeFileSync(profilePath, JSON.stringify(profiles, null, 2), "utf8");
}

function defaultProfile(studentId: string): StudentProfile {
  return {
    studentId,
    name: "Vhea Asesor",
    birthday: "2004-01-15",
    gender: "Female",
    symptomsOrCondition: "No current symptoms reported.",
    contactNumber: "09123456789",
    email: "student@usa.edu.ph",
    schoolIdNumber: "2024-0001",
    birthdayEdited: false,
    genderEdited: false,
  };
}

export function getStudentProfile(studentId: string): StudentProfile {
  const profiles = readAllProfiles();
  const existing = profiles.find((item) => item.studentId === studentId);
  if (existing) return existing;

  const created = defaultProfile(studentId);
  writeAllProfiles([...profiles, created]);
  return created;
}

export type AdminStudentProfileUpdate = {
  newStudentId?: string;
  name?: string;
  email?: string;
  schoolIdNumber?: string;
  contactNumber?: string;
  birthday?: string;
  gender?: string;
  symptomsOrCondition?: string;
  birthdayEdited?: boolean;
  genderEdited?: boolean;
};

/** Full registry edit for admin/staff — bypasses student one-time gender/birthday rules. */
export function updateStudentProfileAdmin(
  currentStudentId: string,
  changes: AdminStudentProfileUpdate
): StudentProfile {
  const profiles = readAllProfiles();
  const idx = profiles.findIndex((item) => item.studentId === currentStudentId);
  if (idx === -1) {
    throw new Error("Student is not in the registry.");
  }

  const existing: StudentProfile = { ...profiles[idx]! };

  const requestedLogin =
    changes.newStudentId !== undefined ? changes.newStudentId.trim() : currentStudentId;
  const nextId = requestedLogin.length > 0 ? requestedLogin : currentStudentId;

  if (nextId !== currentStudentId) {
    if (profiles.some((p) => p.studentId === nextId)) {
      throw new Error("Another account already uses this login.");
    }
    existing.studentId = nextId;
  }

  if (changes.name !== undefined) existing.name = changes.name.trim();
  if (changes.email !== undefined) existing.email = changes.email.trim();
  if (changes.schoolIdNumber !== undefined) {
    existing.schoolIdNumber = changes.schoolIdNumber.trim();
  }
  if (changes.contactNumber !== undefined) {
    existing.contactNumber = changes.contactNumber.trim();
  }
  if (changes.birthday !== undefined) existing.birthday = changes.birthday.trim();
  if (changes.gender !== undefined) existing.gender = changes.gender.trim();
  if (changes.symptomsOrCondition !== undefined) {
    existing.symptomsOrCondition = changes.symptomsOrCondition.trim();
  }
  if (changes.birthdayEdited !== undefined) existing.birthdayEdited = changes.birthdayEdited;
  if (changes.genderEdited !== undefined) existing.genderEdited = changes.genderEdited;

  const filtered = profiles.filter((item) => item.studentId !== currentStudentId);
  writeAllProfiles([...filtered, existing]);
  return existing;
}

export function updateStudentProfile(
  studentId: string,
  changes: Partial<Pick<StudentProfile, "birthday" | "gender">>
): StudentProfile {
  const profiles = readAllProfiles();
  const existing = profiles.find((item) => item.studentId === studentId) ?? defaultProfile(studentId);

  if (typeof changes.gender === "string" && changes.gender.trim()) {
    if (existing.genderEdited) {
      throw new Error("Gender can only be edited once.");
    }
    existing.gender = changes.gender.trim();
    existing.genderEdited = true;
  }

  if (typeof changes.birthday === "string" && changes.birthday.trim()) {
    if (existing.birthdayEdited) {
      throw new Error("Birthday can only be edited once.");
    }
    existing.birthday = changes.birthday.trim();
    existing.birthdayEdited = true;
  }

  const withoutCurrent = profiles.filter((item) => item.studentId !== studentId);
  writeAllProfiles([...withoutCurrent, existing]);
  return existing;
}

export function calculateAge(birthday: string): number | null {
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
