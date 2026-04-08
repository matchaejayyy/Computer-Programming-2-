import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";

import { BROADCAST_NOTIFICATIONS_DB_PATH } from "@/lib/clinic/clinic-paths";

export type BroadcastNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

type NewBroadcastInput = Omit<BroadcastNotification, "id">;

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

  const stdinBody = [input.title.trim(), input.message.trim(), input.createdAt, ""].join("\n");
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
  mkdirSync(dirname(BROADCAST_NOTIFICATIONS_DB_PATH), { recursive: true });

  const viaCpp = createBroadcastNotificationFromCpp(input);
  if (viaCpp !== null) {
    return viaCpp;
  }

  const existing = listBroadcastNotifications();
  const nextNumber = existing.length + 1;
  const row: BroadcastNotification = {
    id: `BCAST-${String(nextNumber).padStart(4, "0")}`,
    title: input.title.trim(),
    message: input.message.trim(),
    createdAt: input.createdAt,
  };
  appendFileSync(BROADCAST_NOTIFICATIONS_DB_PATH, `${JSON.stringify(row)}\n`, "utf8");
  return row;
}
