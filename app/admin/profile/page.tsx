import { AdminChangePassword } from "@/components/admin/dashboard/ChangePassword";
import { HomeLink } from "@/components/admin/dashboard/HomeLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminProfilePage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">Admin Profile</CardTitle>
          <CardDescription>
            For admin accounts, only password reset is editable here.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AdminChangePassword />
        </CardContent>
      </Card>
    </div>
  );
}
