import { NextResponse } from "next/server";

import { listBroadcastNotifications } from "@/lib/clinic/broadcast-notifications";

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
