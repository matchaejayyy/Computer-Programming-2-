import { NextResponse } from "next/server";

import {
  createBroadcastNotification,
  deleteBroadcastNotification,
  listBroadcastNotifications,
  updateBroadcastNotification,
} from "@/lib/clinic/broadcast-notifications";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  const mimeType = file.type || "application/octet-stream";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const allowedByExt = ["pdf", "jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const allowedByMime = ALLOWED_MIME.has(mimeType) || mimeType === "image/jpg";
  return allowedByExt && allowedByMime;
}

async function fileToBase64(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

export async function GET() {
  try {
    return NextResponse.json({ notifications: await listBroadcastNotifications() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load notifications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let title = "";
  let message = "";
  let attachmentFields:
    | { attachmentName: string; attachmentMimeType: string; attachmentData: string }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    title = typeof form.get("title") === "string" ? String(form.get("title")).trim() : "";
    message = typeof form.get("message") === "string" ? String(form.get("message")).trim() : "";
    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      if (!isAllowedFile(file)) {
        return NextResponse.json(
          { error: "Only image files and PDF are allowed." },
          { status: 400 }
        );
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { error: "Attachment must be under 5 MB." },
          { status: 400 }
        );
      }
      const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
      attachmentFields = {
        attachmentName: file.name,
        attachmentMimeType: mimeType,
        attachmentData: await fileToBase64(file),
      };
    }
  } else {
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
    title = typeof payload.title === "string" ? payload.title.trim() : "";
    message = typeof payload.message === "string" ? payload.message.trim() : "";
  }

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  try {
    const created = await createBroadcastNotification({
      title,
      message,
      createdAt: new Date().toISOString(),
      ...attachmentFields,
    });
    return NextResponse.json({ success: true, notification: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send notification." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let id = "";
  let title = "";
  let message = "";
  let removeAttachment = false;
  let attachmentFields:
    | { attachmentName: string; attachmentMimeType: string; attachmentData: string }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    id = typeof form.get("id") === "string" ? String(form.get("id")).trim() : "";
    title = typeof form.get("title") === "string" ? String(form.get("title")).trim() : "";
    message = typeof form.get("message") === "string" ? String(form.get("message")).trim() : "";
    removeAttachment = String(form.get("removeAttachment") || "0") === "1";
    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      if (!isAllowedFile(file)) {
        return NextResponse.json(
          { error: "Only image files and PDF are allowed." },
          { status: 400 }
        );
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { error: "Attachment must be under 5 MB." },
          { status: 400 }
        );
      }
      const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
      attachmentFields = {
        attachmentName: file.name,
        attachmentMimeType: mimeType,
        attachmentData: await fileToBase64(file),
      };
    }
  } else {
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
    id = typeof payload.id === "string" ? payload.id.trim() : "";
    title = typeof payload.title === "string" ? payload.title.trim() : "";
    message = typeof payload.message === "string" ? payload.message.trim() : "";
    removeAttachment = payload.removeAttachment === true;
  }

  if (!id || !title || !message) {
    return NextResponse.json(
      { error: "ID, title, and message are required." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateBroadcastNotification(id, {
      title,
      message,
      ...attachmentFields,
      removeAttachment,
    });
    if (!updated) {
      return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }

  try {
    const deleted = await deleteBroadcastNotification(id);
    if (!deleted) {
      return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete notification." },
      { status: 500 }
    );
  }
}
