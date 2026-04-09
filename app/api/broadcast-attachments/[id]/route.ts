import { NextResponse } from "next/server";

import { getBroadcastAttachment } from "@/lib/clinic/broadcast-notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }

  try {
    const attachment = await getBroadcastAttachment(id);
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    const buffer = Buffer.from(attachment.data, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.name}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load attachment." },
      { status: 500 }
    );
  }
}
