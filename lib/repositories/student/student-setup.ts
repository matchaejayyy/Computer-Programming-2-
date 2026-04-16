import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isBirthdayUnset, isProfileFieldUnset } from "@/lib/repositories/student/profile-placeholders";
import { getStudentProfile } from "@/lib/repositories/student/profile-store";

export async function mustCompleteStudentSetup(studentIdOrEmail: string): Promise<boolean> {
  const profile = await getStudentProfile(studentIdOrEmail);
  if (!profile) return true;

  const user = await prisma.user.findFirst({
    where: {
      role: Role.STUDENT,
      OR: [{ studentId: studentIdOrEmail }, { email: studentIdOrEmail }],
    },
    select: { needsInitialPasswordSetup: true, passwordHash: true },
  });

  return (
    Boolean(user?.needsInitialPasswordSetup || !user?.passwordHash) ||
    isBirthdayUnset(profile.birthday) ||
    isProfileFieldUnset(profile.schoolIdNumber)
  );
}
