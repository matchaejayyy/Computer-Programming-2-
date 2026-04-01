import { HomeLink } from "@/components/clinic/home-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <HomeLink />
      <Card>
        <CardHeader>
          <CardTitle>Help</CardTitle>
          <CardDescription>
            Clinic policies, FAQs, and how to reach staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Find answers about appointments, medical certification, and campus
            clinic services. Contact the clinic office for questions not listed
            here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
