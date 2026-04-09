"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

import { HomeLink } from "@/components/admin/admin-homelink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BroadcastNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  attachmentName?: string;
  attachmentMimeType?: string;
};

export default function BroadcastNotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editAttachment, setEditAttachment] = useState<File | null>(null);
  const [removeEditAttachment, setRemoveEditAttachment] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  function formatCreatedAt(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().replace("T", " ").replace("Z", " UTC");
  }

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/broadcast-notifications");
      const payload = (await response.json()) as {
        notifications?: BroadcastNotification[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load notifications.");
      }
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachment);
    setAttachmentPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/broadcast-notifications", {
        method: "POST",
        body: (() => {
          const form = new FormData();
          form.set("title", title);
          form.set("message", message);
          if (attachment) {
            form.set("attachment", attachment);
          }
          return form;
        })(),
      });
      const payload = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send notification.");
      }
      setTitle("");
      setMessage("");
      setAttachment(null);
      setAttachmentInputKey((prev) => prev + 1);
      setSuccess("Notification sent to all users.");
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  function startEdit(note: BroadcastNotification) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditMessage(note.message);
    setEditAttachment(null);
    setRemoveEditAttachment(false);
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
    setEditAttachment(null);
    setRemoveEditAttachment(false);
  }

  async function saveEdit(id: string) {
    setActionId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/broadcast-notifications", {
        method: "PATCH",
        body: (() => {
          const form = new FormData();
          form.set("id", id);
          form.set("title", editTitle);
          form.set("message", editMessage);
          form.set("removeAttachment", removeEditAttachment ? "1" : "0");
          if (editAttachment) {
            form.set("attachment", editAttachment);
          }
          return form;
        })(),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update notification.");
      }
      setSuccess("Broadcast updated.");
      cancelEdit();
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification.");
    } finally {
      setActionId(null);
    }
  }

  async function removeNotification(id: string) {
    setActionId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/broadcast-notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete notification.");
      }
      if (editingId === id) {
        cancelEdit();
      }
      setSuccess("Broadcast deleted.");
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete notification.");
    } finally {
      setActionId(null);
    }
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <HomeLink />
        </div>
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="size-4" />
              Create Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading broadcast form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Broadcast Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a notification to every user in the clinic portal.
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="size-4" />
            Create Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message</Label>
              <textarea
                id="notification-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-attachment">Attachment (Image or PDF)</Label>
              <Input
                key={attachmentInputKey}
                id="notification-attachment"
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
              {attachmentPreviewUrl && attachment ? (
                attachment.type.startsWith("image/") ? (
                  <img
                    src={attachmentPreviewUrl}
                    alt="Attachment preview"
                    className="max-h-56 w-full rounded-md border border-border object-contain"
                  />
                ) : attachment.type === "application/pdf" ? (
                  <iframe
                    src={attachmentPreviewUrl}
                    title="PDF preview"
                    className="h-64 w-full rounded-md border border-border"
                  />
                ) : null
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}

            <div>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send to all users"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 15).map((note, index) => (
                <div key={`${note.id}-${note.createdAt}-${index}`} className="rounded-lg border border-border px-3 py-2">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        required
                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {note.attachmentName ? (
                        <a
                          href={`/api/broadcast-attachments/${note.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Current attachment: {note.attachmentName}
                        </a>
                      ) : null}
                      <Input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        onChange={(e) => setEditAttachment(e.target.files?.[0] ?? null)}
                      />
                      {note.attachmentName ? (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={removeEditAttachment}
                            onChange={(e) => setRemoveEditAttachment(e.target.checked)}
                          />
                          Remove current attachment
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">{note.title}</p>
                      <p className="text-sm text-muted-foreground">{note.message}</p>
                      {note.attachmentName ? (
                        <a
                          href={`/api/broadcast-attachments/${note.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs text-primary underline"
                        >
                          Attachment: {note.attachmentName}
                        </a>
                      ) : null}
                    </>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatCreatedAt(note.createdAt)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {editingId === note.id ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => void saveEdit(note.id)}
                          disabled={
                            actionId === note.id ||
                            editTitle.trim().length === 0 ||
                            editMessage.trim().length === 0
                          }
                        >
                          {actionId === note.id ? "Saving..." : "Save"}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="outline" onClick={() => startEdit(note)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => void removeNotification(note.id)}
                          disabled={actionId === note.id}
                        >
                          {actionId === note.id ? "Deleting..." : "Delete"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
