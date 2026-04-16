import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

import {
  DEFAULT_STUDENT_PROFILE_DATA,
  isBirthdayUnset,
  isProfileFieldUnset,
} from "@/lib/repositories/student/profile-placeholders";

export type StudentProfile = {
  studentId: string;
  name: string;
  birthday: string;
  gender: string;
  symptomsOrCondition: string;
  contactNumber: string;
  email: string;
  schoolIdNumber: string;
  address: string;
  birthdayEdited: boolean;
  genderEdited: boolean;
};

function mapUserToProfile(
  user: {
    studentId: string | null;
    name: string;
    email: string;
    profile: {
      birthday: string;
      gender: string;
      symptomsOrCondition: string;
      contactNumber: string;
      schoolIdNumber: string;
      address: string;
      birthdayEdited: boolean;
      genderEdited: boolean;
    } | null;
  }
): StudentProfile | null {
  if (!user.profile) {
    return null;
  }
  const sid = user.studentId ?? user.email;
  return {
    studentId: sid,
    name: user.name,
    birthday: user.profile.birthday,
    gender: user.profile.gender,
    symptomsOrCondition: user.profile.symptomsOrCondition,
    contactNumber: user.profile.contactNumber,
    email: user.email,
    schoolIdNumber: user.profile.schoolIdNumber,
    address: user.profile.address,
    birthdayEdited: user.profile.birthdayEdited,
    genderEdited: user.profile.genderEdited,
  };
}

export async function listStoredStudentProfiles(): Promise<StudentProfile[]> {
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" as Role },
    include: { profile: true },
    orderBy: { name: "asc" },
  });
  const missingProfileUserIds = users.filter((u) => !u.profile).map((u) => u.id);
  if (missingProfileUserIds.length > 0) {
    await prisma.studentProfile.createMany({
      data: missingProfileUserIds.map((userId) => ({
        userId,
        ...DEFAULT_STUDENT_PROFILE_DATA,
      })),
      skipDuplicates: true,
    });
  }
  const hydratedUsers =
    missingProfileUserIds.length > 0
      ? await prisma.user.findMany({
          where: { role: "STUDENT" as Role },
          include: { profile: true },
          orderBy: { name: "asc" },
        })
      : users;

  const out: StudentProfile[] = [];
  for (const u of hydratedUsers) {
    const p = mapUserToProfile(u);
    if (p) out.push(p);
  }
  return out;
}

/** Creates placeholder profile for students who have User but no StudentProfile (e.g. old email sign-ups). */
export async function ensureStudentProfileIfMissing(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || user.role !== "STUDENT" || user.profile) {
    return;
  }
  await prisma.studentProfile.create({
    data: {
      userId: user.id,
      ...DEFAULT_STUDENT_PROFILE_DATA,
    },
  });
}

export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const user = await prisma.user.findFirst({
    where: {
      role: "STUDENT",
      OR: [{ studentId }, { email: studentId }],
    },
    include: { profile: true },
  });
  if (!user) {
    return null;
  }
  if (!user.profile) {
    try {
      const created = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          ...DEFAULT_STUDENT_PROFILE_DATA,
        },
      });
      return mapUserToProfile({ ...user, profile: created });
    } catch {
      const again = await prisma.user.findFirst({
        where: { id: user.id },
        include: { profile: true },
      });
      return again ? mapUserToProfile(again) : null;
    }
  }
  return mapUserToProfile(user);
}

export type AdminStudentProfileUpdate = {
  newStudentId?: string;
  name?: string;
  email?: string;
  schoolIdNumber?: string;
  contactNumber?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  symptomsOrCondition?: string;
  birthdayEdited?: boolean;
  genderEdited?: boolean;
};

export async function updateStudentProfileAdmin(
  currentStudentId: string,
  changes: AdminStudentProfileUpdate
): Promise<StudentProfile> {
  const user = await prisma.user.findFirst({
    where: {
      role: "STUDENT",
      OR: [{ studentId: currentStudentId }, { email: currentStudentId }],
    },
    include: { profile: true },
  });
  if (!user?.profile) {
    throw new Error("Student is not in the registry.");
  }

  const currentLogin = user.studentId ?? user.email;
  const requestedLogin =
    changes.newStudentId !== undefined ? changes.newStudentId.trim() : currentLogin;
  const nextId = requestedLogin.length > 0 ? requestedLogin : currentLogin;

  if (nextId !== (user.studentId ?? "")) {
    const clash = await prisma.user.findFirst({
      where: { studentId: nextId, NOT: { id: user.id } },
    });
    if (clash) {
      throw new Error("Another account already uses this login.");
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      studentId: nextId,
      ...(changes.name !== undefined ? { name: changes.name.trim() } : {}),
      ...(changes.email !== undefined ? { email: changes.email.trim() } : {}),
      profile: {
        update: {
          ...(changes.schoolIdNumber !== undefined
            ? { schoolIdNumber: changes.schoolIdNumber.trim() }
            : {}),
          ...(changes.contactNumber !== undefined
            ? { contactNumber: changes.contactNumber.trim() }
            : {}),
          ...(changes.address !== undefined ? { address: changes.address.trim() } : {}),
          ...(changes.birthday !== undefined ? { birthday: changes.birthday.trim() } : {}),
          ...(changes.gender !== undefined ? { gender: changes.gender.trim() } : {}),
          ...(changes.symptomsOrCondition !== undefined
            ? { symptomsOrCondition: changes.symptomsOrCondition.trim() }
            : {}),
          ...(changes.birthdayEdited !== undefined
            ? { birthdayEdited: changes.birthdayEdited }
            : {}),
          ...(changes.genderEdited !== undefined ? { genderEdited: changes.genderEdited } : {}),
        },
      },
    },
  });

  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { profile: true },
  });
  const mapped = mapUserToProfile(fresh);
  if (!mapped) {
    throw new Error("Student is not in the registry.");
  }
  return mapped;
}

export async function updateStudentProfile(
  studentId: string,
  changes: Partial<
    Pick<
      StudentProfile,
      | "birthday"
      | "gender"
      | "address"
      | "contactNumber"
      | "schoolIdNumber"
      | "symptomsOrCondition"
    >
  >
): Promise<StudentProfile> {
  const user = await prisma.user.findFirst({
    where: {
      role: "STUDENT",
      OR: [{ studentId }, { email: studentId }],
    },
    include: { profile: true },
  });
  if (!user?.profile) {
    throw new Error("Profile not found.");
  }

  const p = user.profile;

  if (typeof changes.gender === "string" && changes.gender.trim()) {
    if (!isProfileFieldUnset(p.gender)) {
      throw new Error("Gender can only be changed by clinic staff.");
    }
  }

  if (typeof changes.birthday === "string" && changes.birthday.trim()) {
    if (!isBirthdayUnset(p.birthday)) {
      throw new Error("Birthday can only be changed by clinic staff.");
    }
  }

  if (typeof changes.schoolIdNumber === "string") {
    if (!isProfileFieldUnset(p.schoolIdNumber)) {
      throw new Error("School ID can only be changed by clinic staff.");
    }
  }

  if (typeof changes.symptomsOrCondition === "string") {
    if (!isProfileFieldUnset(p.symptomsOrCondition)) {
      throw new Error("Symptoms / condition can only be changed by clinic staff.");
    }
  }

  const updatedProfile = await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      ...(typeof changes.gender === "string" && changes.gender.trim()
        ? { gender: changes.gender.trim(), genderEdited: true }
        : {}),
      ...(typeof changes.birthday === "string" && changes.birthday.trim()
        ? { birthday: changes.birthday.trim(), birthdayEdited: true }
        : {}),
      ...(typeof changes.address === "string"
        ? { address: changes.address.trim() }
        : {}),
      ...(typeof changes.contactNumber === "string"
        ? { contactNumber: changes.contactNumber.trim() }
        : {}),
      ...(typeof changes.schoolIdNumber === "string"
        ? { schoolIdNumber: changes.schoolIdNumber.trim() }
        : {}),
      ...(typeof changes.symptomsOrCondition === "string"
        ? { symptomsOrCondition: changes.symptomsOrCondition.trim() }
        : {}),
    },
  });

  const mapped = mapUserToProfile({ ...user, profile: updatedProfile });
  if (!mapped) {
    throw new Error("Profile not found.");
  }
  return mapped;
}

export function calculateAge(birthday: string): number | null {
  if (isBirthdayUnset(birthday)) {
    return null;
  }
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
