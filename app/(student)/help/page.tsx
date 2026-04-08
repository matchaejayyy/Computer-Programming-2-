import { HomeLink } from "@/components/clinic/home-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHelpContent } from "@/lib/clinic/help-content";

export default function HelpPage() {
  const content = getHelpContent();
  const safePhoneHref = `tel:${content.phone.replace(/\s+/g, "")}`;
  const safeEmailHref = `mailto:${content.email}`;

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
          <p>{content.intro}</p>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {content.contactTitle}
            </p>
            <p className="mt-2 text-sm text-foreground">
              Phone:{" "}
              <a
                href={safePhoneHref}
                className="font-medium text-[#E50000] underline underline-offset-4 hover:opacity-80"
              >
                {content.phone}
              </a>
            </p>
            <p className="mt-1 text-sm text-foreground">
              Email:{" "}
              <a
                href={safeEmailHref}
                className="font-medium text-[#E50000] underline underline-offset-4 hover:opacity-80"
              >
                {content.email}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
