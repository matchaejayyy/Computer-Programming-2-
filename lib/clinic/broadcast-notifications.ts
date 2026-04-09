import { prisma } from "@/lib/prisma";

export type BroadcastNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentData?: string;
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

function toExternalFormat(
  row: {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    attachmentName: string | null;
    attachmentMimeType: string | null;
    attachmentData: string | null;
  },
  includeData = false
): BroadcastNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    attachmentName: row.attachmentName ?? undefined,
    attachmentMimeType: row.attachmentMimeType ?? undefined,
    attachmentData: includeData ? (row.attachmentData ?? undefined) : undefined,
  };
}

export async function listBroadcastNotifications(): Promise<BroadcastNotification[]> {
  const rows = await prisma.broadcastNotification.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toExternalFormat(row, true));
}

export async function createBroadcastNotification(
  input: NewBroadcastInput
): Promise<BroadcastNotification> {
  const existing = await prisma.broadcastNotification.findMany({
    select: { id: true },
  });
  const nextNumber =
    existing.reduce(
      (maxValue, row) => Math.max(maxValue, getBroadcastNumericId(row.id)),
      0
    ) + 1;

  const row = await prisma.broadcastNotification.create({
    data: {
      id: `BCAST-${String(nextNumber).padStart(4, "0")}`,
      title: input.title.trim(),
      message: input.message.trim(),
      createdAt: new Date(input.createdAt),
      attachmentName: input.attachmentName?.trim() || null,
      attachmentMimeType: input.attachmentMimeType?.trim() || null,
      attachmentData: input.attachmentData?.trim() || null,
    },
  });
  return toExternalFormat(row);
}

export async function updateBroadcastNotification(
  id: string,
  updates: Pick<BroadcastNotification, "title" | "message"> & {
    attachmentName?: string;
    attachmentMimeType?: string;
    attachmentData?: string;
    removeAttachment?: boolean;
  }
): Promise<BroadcastNotification | null> {
  const current = await prisma.broadcastNotification.findUnique({
    where: { id },
  });
  if (!current) {
    return null;
  }

  const data: Record<string, unknown> = {
    title: updates.title.trim(),
    message: updates.message.trim(),
  };

  if (updates.removeAttachment) {
    data.attachmentName = null;
    data.attachmentMimeType = null;
    data.attachmentData = null;
  } else if (updates.attachmentName && updates.attachmentMimeType && updates.attachmentData) {
    data.attachmentName = updates.attachmentName.trim();
    data.attachmentMimeType = updates.attachmentMimeType.trim();
    data.attachmentData = updates.attachmentData.trim();
  }

  const updated = await prisma.broadcastNotification.update({
    where: { id },
    data,
  });
  return toExternalFormat(updated);
}

export async function deleteBroadcastNotification(id: string): Promise<boolean> {
  const existing = await prisma.broadcastNotification.findUnique({
    where: { id },
  });
  if (!existing) {
    return false;
  }
  await prisma.broadcastNotification.delete({ where: { id } });
  return true;
}

export async function getBroadcastAttachment(
  id: string
): Promise<{ name: string; mimeType: string; data: string } | null> {
  const row = await prisma.broadcastNotification.findUnique({
    where: { id },
    select: {
      attachmentName: true,
      attachmentMimeType: true,
      attachmentData: true,
    },
  });
  if (!row?.attachmentData || !row.attachmentMimeType) {
    return null;
  }
  return {
    name: row.attachmentName || "attachment",
    mimeType: row.attachmentMimeType,
    data: row.attachmentData,
  };
}
