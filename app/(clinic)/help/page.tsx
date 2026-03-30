import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Link>
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
