import { redirect } from "next/navigation";

/** Legacy URL: go straight to request review (no separate hub). */
export default function AdminAppointmentsRedirectPage() {
  redirect("/admin/requests");
}
