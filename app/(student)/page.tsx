import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { HomeDashboard } from "@/components/clinic/home-dashboard";
import { mustCompleteStudentSetup } from "@/lib/clinic/student-setup";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (session.user.role === "STUDENT") {
    const lookup = session.user.studentId ?? session.user.email;
    const needsSetup = await mustCompleteStudentSetup(lookup);
    if (needsSetup) {
      redirect("/complete-profile");
    }
  }
  return <HomeDashboard />;
}
