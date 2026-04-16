import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProfilePatientDetails } from "@/components/student/profile/PatientDetails";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mustCompleteStudentSetup } from "@/lib/repositories/student/student-setup";

export default async function CompleteProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const lookup = session.user.studentId ?? session.user.email;
  const needsSetup = await mustCompleteStudentSetup(lookup);
  if (!needsSetup) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">Complete your profile</CardTitle>
          <CardDescription>
            Please finish your required account information first. Home access is unlocked after
            completing setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <ProfilePatientDetails />
        </CardContent>
      </Card>
    </div>
  );
}
