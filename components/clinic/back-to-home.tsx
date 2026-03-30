"use client";

import Link from "next/link";
import { Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToHome() {
  return (
    <div className="flex w-full justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full max-w-md justify-center gap-2 border-clinic-blue/25 bg-clinic-surface text-clinic-blue hover:bg-clinic-surface/80"
        )}
      >
        <Home className="size-4 shrink-0" aria-hidden />
        Back to Main Menu
      </Link>
    </div>
  );
}
