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
          "w-full max-w-md justify-center gap-2.5 border-2 border-red-200 bg-white font-semibold text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50"
        )}
      >
        <Home className="size-4 shrink-0" aria-hidden />
        Back to Main Menu
      </Link>
    </div>
  );
}
