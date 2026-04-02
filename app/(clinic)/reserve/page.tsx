"use client";

import { BackToHome } from "@/components/clinic/back-to-home";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="flex flex-col gap-6"> 
        <ReserveForm />
        <BackToHome />
      </div>
    </div>
  );
}
