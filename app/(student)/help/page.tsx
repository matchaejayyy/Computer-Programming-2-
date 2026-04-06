import { HomeLink } from "@/components/clinic/home-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <Card className="border border-neutral-200 bg-white px-5 py-8 shadow-sm">
        <CardHeader className="border-b border-neutral-200 pb-4">
          <CardTitle className="text-lg text-foreground">Help</CardTitle>
          <CardDescription>
            Clinic policies, FAQs, and how to reach staff.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-muted-foreground">
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
