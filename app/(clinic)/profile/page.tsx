import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProfileChangePassword } from "@/components/clinic/profile-change-password";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Link>
      <Card className="border border-clinic-blue/30 bg-clinic-surface shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">Profile</CardTitle>
          <CardDescription>
            View and update your student profile and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Vhea Asesor</p>
            <p className="mt-1">student@usa.edu.ph</p>
          </div>
          <Separator />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reset your password with your current one, or use forgot password
              if you cannot sign in.
            </p>
            <ProfileChangePassword />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
