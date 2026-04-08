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
};

export default function BroadcastNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/admin/broadcast-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      const payload = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send notification.");
      }
      setTitle("");
      setMessage("");
      setSuccess("Notification sent to all users.");
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
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
              {notifications.slice(0, 15).map((note) => (
                <div key={note.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">{note.title}</p>
                  <p className="text-sm text-muted-foreground">{note.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
