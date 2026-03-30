import Link from "next/link";
import { Bell } from "lucide-react";

import { ProfileMenu } from "@/components/clinic/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppTopBar() {
  return (
    <div className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="min-w-0 shrink text-base font-bold tracking-tight text-foreground sm:text-lg"
        >
          University of San Agustin
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="relative text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <Badge className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border-0 bg-primary p-0 text-[10px] text-primary-foreground">
              20
            </Badge>
          </Button>

          <div className="border-l border-border pl-2 sm:pl-3">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
