"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ProfileMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName = session?.user?.name?.trim() || "Student";
  const initials =
    displayName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open profile menu"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-auto gap-3 rounded-xl px-2 py-2 font-medium shadow-none hover:bg-neutral-100"
        )}
      >
        <span className="max-w-24 truncate text-left text-[11px] font-bold uppercase leading-tight text-foreground sm:max-w-56 sm:text-xs">
          {displayName}
        </span>
        <Avatar className="size-9 ring-0">
          <AvatarFallback className="bg-[#00B050] text-sm font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[12rem] rounded-xl border border-border/60 bg-card p-2 text-foreground shadow-lg ring-1 ring-black/5"
      >
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-normal text-foreground focus:bg-muted"
          onClick={() => router.push("/profile")}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-normal text-foreground focus:bg-muted"
          onClick={() => router.push("/help")}
        >
          Help
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-normal focus:bg-destructive/10"
          onClick={async () => {
            await signOut({ callbackUrl: "/login" });
          }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
