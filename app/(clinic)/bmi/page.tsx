import { ClipboardList } from "lucide-react";

import { HomeLink } from "@/components/clinic/home-link";
import { ProfileBmi } from "@/components/clinic/profile-bmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BmiPage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <Card className="border border-border px-5 py-8 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">BMI Checker</CardTitle>
            <CardDescription>
              Enter your height and weight to view your BMI and category.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfileBmi studentId="student@usa.edu.ph" />
        </CardContent>
      </Card>
    </div>
  );
}
