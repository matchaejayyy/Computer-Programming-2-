import { AppTopBar } from "@/components/clinic/app-top-bar";

export default function ClinicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="sticky top-0 z-50">
        <AppTopBar />
      </div>
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
