"use client";

import { HomeLink } from "@/components/clinic/home-link";
import { ReserveForm } from "@/components/clinic/reserve-form";

export default function ReservePage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <ReserveForm />
    </div>
  );
}