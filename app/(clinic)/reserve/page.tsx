"use client";

import { HomeLink } from "@/components/clinic/home-link";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
      <HomeLink />
      <ReserveForm />
    </div>
  );
}