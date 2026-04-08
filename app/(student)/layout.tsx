import { AppTopBar } from "@/components/clinic/app-top-bar";
import { ClinicStudentBridge } from "@/components/clinic/clinic-student-bridge";
import { PageTransition } from "@/components/clinic/page-transition";
import { auth } from "@/auth";

export default async function ClinicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const studentId =
    session?.user?.role === "STUDENT"
      ? (session.user.studentId ?? session.user.email ?? "")
      : "";

  return (
    <ClinicStudentBridge studentId={studentId}>
      <div className="flex min-h-dvh flex-col bg-[#f4f4f5] text-foreground">
        <div className="sticky top-0 z-50 shrink-0">
          <AppTopBar studentId={studentId} />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-12 2xl:px-16">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
    </ClinicStudentBridge>
  );
}
