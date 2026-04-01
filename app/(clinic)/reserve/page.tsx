"use client";

import { BackToHome } from "@/components/clinic/back-to-home";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
      <ReserveForm />
      <BackToHome />
    </div>
  );
}
