import { HomeLink } from "@/components/clinic/home-link";
import { ProfileBmi } from "@/components/clinic/profile-bmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BmiPage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <HomeLink />

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg text-foreground">BMI checker</CardTitle>
          <CardDescription>
            Enter your height and weight to view your BMI and category.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ProfileBmi studentId="student@usa.edu.ph" />
        </CardContent>
      </Card>
    </div>
  );
}
