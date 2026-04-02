import { HomeLink } from "@/components/clinic/home-link";
import { ProfilePatientDetails } from "@/components/clinic/profile-patient-details";
import { ProfileChangePassword } from "@/components/clinic/profile-change-password";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <HomeLink />
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">Profile</CardTitle>
          <CardDescription>
            View and update your student profile and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <ProfilePatientDetails studentId="student@usa.edu.ph" />
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
