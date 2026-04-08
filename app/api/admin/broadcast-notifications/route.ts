import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import { randomUUID } from "crypto";

import {
  createBroadcastNotification,
  deleteBroadcastNotification,
  listBroadcastNotifications,
  updateBroadcastNotification,
} from "@/lib/clinic/broadcast-notifications";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function saveAttachment(file: File) {
  const mimeType = file.type || "application/octet-stream";
  const ext = extname(file.name).toLowerCase();
  const allowedByExt = ext === ".pdf" || [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
  const allowedByMime = mimeType === "application/pdf" || mimeType.startsWith("image/");
  if (!allowedByExt || !allowedByMime || (!ALLOWED_MIME.has(mimeType) && mimeType !== "image/jpg")) {
    throw new Error("Only image files and PDF are allowed.");
  }

  const fileName = `${Date.now()}-${randomUUID()}-${sanitizeFileName(file.name)}`;
  const relativePath = `/uploads/broadcasts/${fileName}`;
  const absoluteDir = join(process.cwd(), "public", "uploads", "broadcasts");
  const absolutePath = join(absoluteDir, fileName);
  await mkdir(absoluteDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));
  return {
    attachmentName: file.name,
    attachmentPath: relativePath,
    attachmentMimeType: mimeType === "image/jpg" ? "image/jpeg" : mimeType,
  };
}

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
  const contentType = request.headers.get("content-type") || "";
  let title = "";
  let message = "";
  let attachment:
    | { attachmentName: string; attachmentPath: string; attachmentMimeType: string }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    title = typeof form.get("title") === "string" ? String(form.get("title")).trim() : "";
    message = typeof form.get("message") === "string" ? String(form.get("message")).trim() : "";
    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      try {
        attachment = await saveAttachment(file);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Could not save attachment." },
          { status: 400 }
        );
      }
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
    const created = createBroadcastNotification({
      title,
      message,
      createdAt: new Date().toISOString(),
      ...attachment,
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
  let attachment:
    | { attachmentName: string; attachmentPath: string; attachmentMimeType: string }
    | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    id = typeof form.get("id") === "string" ? String(form.get("id")).trim() : "";
    title = typeof form.get("title") === "string" ? String(form.get("title")).trim() : "";
    message = typeof form.get("message") === "string" ? String(form.get("message")).trim() : "";
    removeAttachment = String(form.get("removeAttachment") || "0") === "1";
    const file = form.get("attachment");
    if (file instanceof File && file.size > 0) {
      try {
        attachment = await saveAttachment(file);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Could not save attachment." },
          { status: 400 }
        );
      }
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
    const updated = updateBroadcastNotification(id, {
      title,
      message,
      ...attachment,
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
    const deleted = deleteBroadcastNotification(id);
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
