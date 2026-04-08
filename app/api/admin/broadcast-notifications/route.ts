import { NextResponse } from "next/server";

import {
  createBroadcastNotification,
  listBroadcastNotifications,
} from "@/lib/clinic/broadcast-notifications";

export async function GET() {
  try {
    return NextResponse.json({ notifications: listBroadcastNotifications() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load notifications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  try {
    const created = createBroadcastNotification({
      title,
      message,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, notification: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send notification." },
      { status: 500 }
    );
  }
}
