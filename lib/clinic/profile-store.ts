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
