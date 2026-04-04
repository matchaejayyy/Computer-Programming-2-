import { BadgeCheck, ClipboardList } from "lucide-react";

import { HomeLink } from "@/components/clinic/home-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const samples = [
  { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-900" },
  { label: "Approved", className: "border-green-600 bg-green-600 text-white" },
  { label: "Rejected", className: "border-red-200 bg-red-50 text-red-800" },
] as const;

export default function StatusPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
      <HomeLink />
      <Card className="border border-clinic-blue/30 bg-clinic-surface shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-foreground ring-1 ring-border">
            <ClipboardList className="size-6" aria-hidden />
            <BadgeCheck
              className="absolute -bottom-0.5 -right-0.5 size-5 text-green-600"
              aria-hidden
            />
          </span>
          <CardTitle className="text-lg text-foreground">
            Check appointment status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Your request may be shown with one of these statuses after the clinic
            reviews it.
          </p>
          <Separator />
          <ul className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <li key={s.label}>
                <Badge
                  variant="outline"
                  className={cn("px-3 py-1 text-sm", s.className)}
                >
                  {s.label}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
