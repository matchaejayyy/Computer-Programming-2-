import { NextResponse } from "next/server";

import type { RequestStatus } from "@/lib/utils/constants/mock-requests";

function isRequestStatus(s: string): s is RequestStatus {
  return (
    s === "pending" ||
    s === "approved" ||
    s === "rejected" ||
    s === "cancelled" ||
    s === "no_show" ||
    s === "completed"
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { statuses?: unknown }).statuses)
  ) {
    return NextResponse.json(
      { error: "Expected { statuses: RequestStatus[] }" },
      { status: 400 }
    );
  }

  const raw = (body as { statuses: unknown[] }).statuses;
  const statuses: RequestStatus[] = [];
  for (const s of raw) {
    if (typeof s !== "string" || !isRequestStatus(s)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    statuses.push(s);
  }

  const indices = statuses
    .map((s, i) => (s === "no_show" ? i : -1))
    .filter((i) => i >= 0);
  return NextResponse.json({ indices });
}
