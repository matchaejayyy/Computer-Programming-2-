"use client";

import { HomeLink } from "@/components/clinic/home-link";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <HomeLink />
      <ReserveForm />
    </div>
  );
}
