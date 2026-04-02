"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type HomeLinkProps = {
  className?: string;
  href?: string;
  label?: string;
};

export function HomeLink({ className, href = "/admin", label = "Dashboard" }: HomeLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted",
        className
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
