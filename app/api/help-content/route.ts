import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getHelpContent, updateHelpContent } from "@/lib/clinic/help-content";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: getHelpContent() });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object." }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const data = updateHelpContent({
    intro: typeof raw.intro === "string" ? raw.intro : undefined,
    contactTitle: typeof raw.contactTitle === "string" ? raw.contactTitle : undefined,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
  });

  return NextResponse.json({ success: true, data });
}
