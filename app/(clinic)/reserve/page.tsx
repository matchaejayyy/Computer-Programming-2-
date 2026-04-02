"use client";

import { BackToHome } from "@/components/clinic/back-to-home";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-0 lg:px-8">
      <div className="flex flex-col gap-6"> 
        <ReserveForm />
        <BackToHome />
      </div>
    </div>
  );
}
