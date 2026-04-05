import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { PageTransition } from "@/components/clinic/page-transition";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f4f5] text-foreground">
      <div className="sticky top-0 z-50 shrink-0">
        <AdminTopBar />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full min-w-0 max-w-full px-3 py-5 sm:px-6 sm:py-8 lg:px-8 xl:px-12 2xl:px-16">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
