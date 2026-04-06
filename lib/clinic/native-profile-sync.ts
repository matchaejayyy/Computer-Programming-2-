import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

import { prisma } from "@/lib/prisma";

import { STUDENT_PROFILES_JSON_PATH } from "@/lib/clinic/clinic-paths";
import type { StudentProfile } from "@/lib/clinic/profile-store";

export async function syncStudentProfilesJsonFromDb(): Promise<void> {
  const profiles = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { profile: true },
  });
  const arr: StudentProfile[] = [];
  for (const u of profiles) {
    if (!u.studentId || !u.profile) continue;
    arr.push({
      studentId: u.studentId,
      name: u.name,
      birthday: u.profile.birthday,
      gender: u.profile.gender,
      symptomsOrCondition: u.profile.symptomsOrCondition,
      contactNumber: u.profile.contactNumber,
      email: u.email,
      schoolIdNumber: u.profile.schoolIdNumber,
      address: u.profile.address,
      birthdayEdited: u.profile.birthdayEdited,
      genderEdited: u.profile.genderEdited,
    });
  }
  mkdirSync(dirname(STUDENT_PROFILES_JSON_PATH), { recursive: true });
  writeFileSync(STUDENT_PROFILES_JSON_PATH, JSON.stringify(arr, null, 2), "utf8");
}
