import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";

import { BROADCAST_NOTIFICATIONS_DB_PATH } from "@/lib/clinic/clinic-paths";

export type BroadcastNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  attachmentName?: string;
  attachmentPath?: string;
  attachmentMimeType?: string;
};

type NewBroadcastInput = Omit<BroadcastNotification, "id">;

function getBroadcastNumericId(id: string): number {
  const match = /^BCAST-(\d+)$/.exec(id.trim());
  if (!match) {
    return -1;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : -1;
}

function listBroadcastNotificationsFromCpp(): BroadcastNotification[] | null {
  const binary =
    process.platform === "win32"
      ? "list_broadcast_notifications.exe"
      : "list_broadcast_notifications";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const result = spawnSync(executable, [BROADCAST_NOTIFICATIONS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const data = JSON.parse(result.stdout.trim()) as { notifications?: unknown };
    if (!Array.isArray(data.notifications)) {
      return null;
    }
    const parsed: BroadcastNotification[] = [];
    for (const item of data.notifications) {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      if (
        typeof row.id !== "string" ||
        typeof row.title !== "string" ||
        typeof row.message !== "string" ||
        typeof row.createdAt !== "string"
      ) {
        return null;
      }
      parsed.push({
        id: row.id,
        title: row.title,
        message: row.message,
        createdAt: row.createdAt,
        attachmentName:
          typeof row.attachmentName === "string" && row.attachmentName.trim().length > 0
            ? row.attachmentName
            : undefined,
        attachmentPath:
          typeof row.attachmentPath === "string" && row.attachmentPath.trim().length > 0
            ? row.attachmentPath
            : undefined,
        attachmentMimeType:
          typeof row.attachmentMimeType === "string" && row.attachmentMimeType.trim().length > 0
            ? row.attachmentMimeType
            : undefined,
      });
    }
    return parsed;
  } catch {
    return null;
  }
}

function createBroadcastNotificationFromCpp(
  input: NewBroadcastInput
): BroadcastNotification | null {
  const binary =
    process.platform === "win32"
      ? "save_broadcast_notification.exe"
      : "save_broadcast_notification";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const stdinBody = [
    input.title.trim(),
    input.message.trim(),
    input.createdAt,
    input.attachmentName?.trim() || "",
    input.attachmentPath?.trim() || "",
    input.attachmentMimeType?.trim() || "",
    "",
  ].join("\n");
  const result = spawnSync(executable, [BROADCAST_NOTIFICATIONS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: stdinBody,
    maxBuffer: 5 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const row = JSON.parse(result.stdout.trim()) as BroadcastNotification;
    if (
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      typeof row.message !== "string" ||
      typeof row.createdAt !== "string"
    ) {
      return null;
    }
    return row;
  } catch {
    return null;
  }
}

function updateBroadcastNotificationFromCpp(
  id: string,
  updates: Pick<BroadcastNotification, "title" | "message"> & {
    attachmentName?: string;
    attachmentPath?: string;
    attachmentMimeType?: string;
    removeAttachment?: boolean;
  }
): BroadcastNotification | null {
  const binary =
    process.platform === "win32"
      ? "update_broadcast_notification.exe"
      : "update_broadcast_notification";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const stdinBody = [
    id.trim(),
    updates.title.trim(),
    updates.message.trim(),
    updates.attachmentName?.trim() || "",
    updates.attachmentPath?.trim() || "",
    updates.attachmentMimeType?.trim() || "",
    updates.removeAttachment ? "1" : "0",
    "",
  ].join("\n");
  const result = spawnSync(executable, [BROADCAST_NOTIFICATIONS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: stdinBody,
    maxBuffer: 5 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || !result.stdout?.trim()) {
    return null;
  }

  try {
    const row = JSON.parse(result.stdout.trim()) as BroadcastNotification;
    if (
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      typeof row.message !== "string" ||
      typeof row.createdAt !== "string"
    ) {
      return null;
    }
    return row;
  } catch {
    return null;
  }
}

function deleteBroadcastNotificationFromCpp(id: string): boolean | null {
  const binary =
    process.platform === "win32"
      ? "delete_broadcast_notification.exe"
      : "delete_broadcast_notification";
  const executable = join(process.cwd(), "native", "appointments", binary);
  if (!existsSync(executable)) {
    return null;
  }

  const result = spawnSync(executable, [BROADCAST_NOTIFICATIONS_DB_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: `${id.trim()}\n`,
    maxBuffer: 5 * 1024 * 1024,
  });
  return !result.error && result.status === 0;
}

export function listBroadcastNotifications(): BroadcastNotification[] {
  const viaCpp = listBroadcastNotificationsFromCpp();
  if (viaCpp !== null) {
    return viaCpp.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (!existsSync(BROADCAST_NOTIFICATIONS_DB_PATH)) {
    return [];
  }
  const lines = readFileSync(BROADCAST_NOTIFICATIONS_DB_PATH, "utf8")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const out: BroadcastNotification[] = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as BroadcastNotification;
      if (
        row &&
        typeof row.id === "string" &&
        typeof row.title === "string" &&
        typeof row.message === "string" &&
        typeof row.createdAt === "string"
      ) {
        out.push(row);
      }
    } catch {
      // Skip malformed lines.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createBroadcastNotification(input: NewBroadcastInput): BroadcastNotification {
  const viaCpp = createBroadcastNotificationFromCpp(input);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const existing = listBroadcastNotifications();
  const nextNumber =
    existing.reduce((maxValue, row) => Math.max(maxValue, getBroadcastNumericId(row.id)), 0) + 1;
  const row: BroadcastNotification = {
    id: `BCAST-${String(nextNumber).padStart(4, "0")}`,
    title: input.title.trim(),
    message: input.message.trim(),
    createdAt: input.createdAt,
    attachmentName: input.attachmentName?.trim() || undefined,
    attachmentPath: input.attachmentPath?.trim() || undefined,
    attachmentMimeType: input.attachmentMimeType?.trim() || undefined,
  };
  try {
    mkdirSync(dirname(BROADCAST_NOTIFICATIONS_DB_PATH), { recursive: true });
    appendFileSync(BROADCAST_NOTIFICATIONS_DB_PATH, `${JSON.stringify(row)}\n`, "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel) — return the record without persisting to disk.
  }
  return row;
}

function writeBroadcastNotifications(notifications: BroadcastNotification[]) {
  try {
    mkdirSync(dirname(BROADCAST_NOTIFICATIONS_DB_PATH), { recursive: true });
    const body =
      notifications.length > 0
        ? `${notifications.map((row) => JSON.stringify(row)).join("\n")}\n`
        : "";
    writeFileSync(BROADCAST_NOTIFICATIONS_DB_PATH, body, "utf8");
  } catch {
    // Read-only filesystem (e.g. Vercel) — skip disk write.
  }
}

export function updateBroadcastNotification(
  id: string,
  updates: Pick<BroadcastNotification, "title" | "message"> & {
    attachmentName?: string;
    attachmentPath?: string;
    attachmentMimeType?: string;
    removeAttachment?: boolean;
  }
): BroadcastNotification | null {
  const viaCpp = updateBroadcastNotificationFromCpp(id, updates);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const all = listBroadcastNotifications();
  const index = all.findIndex((row) => row.id === id);
  if (index < 0) {
    return null;
  }

  const current = all[index];
  const updated: BroadcastNotification = {
    ...current,
    title: updates.title.trim(),
    message: updates.message.trim(),
  };
  if (updates.removeAttachment) {
    delete updated.attachmentName;
    delete updated.attachmentPath;
    delete updated.attachmentMimeType;
  } else if (
    updates.attachmentName &&
    updates.attachmentPath &&
    updates.attachmentMimeType
  ) {
    updated.attachmentName = updates.attachmentName.trim();
    updated.attachmentPath = updates.attachmentPath.trim();
    updated.attachmentMimeType = updates.attachmentMimeType.trim();
  }
  all[index] = updated;
  writeBroadcastNotifications(all);
  return updated;
}

export function deleteBroadcastNotification(id: string): boolean {
  const viaCpp = deleteBroadcastNotificationFromCpp(id);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const all = listBroadcastNotifications();
  const filtered = all.filter((row) => row.id !== id);
  if (filtered.length === all.length) {
    return false;
  }
  writeBroadcastNotifications(filtered);
  return true;
}
