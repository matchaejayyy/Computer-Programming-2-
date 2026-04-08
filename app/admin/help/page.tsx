import { AdminHelpEditor } from "@/components/admin/admin-help-editor";
import { HomeLink } from "@/components/admin/admin-homelink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminHelpPage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">Help Content</CardTitle>
          <CardDescription>
            Edit help details here. Changes will appear on the student Help page.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AdminHelpEditor />
        </CardContent>
      </Card>
    </div>
  );
}
