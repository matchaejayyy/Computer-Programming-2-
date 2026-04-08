"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HelpContent = {
  intro: string;
  contactTitle: string;
  phone: string;
  email: string;
};

export function AdminHelpEditor() {
  const [data, setData] = useState<HelpContent>({
    intro: "",
    contactTitle: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/help-content");
        const body = (await res.json()) as { data?: HelpContent; error?: string };
        if (!res.ok) throw new Error(body.error || "Failed to load help content.");
        if (!cancelled && body.data) {
          setData(body.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load help content.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/help-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Failed to save help content.");
      setMessage("Help content updated. Student Help page now uses these details.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save help content.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading help content...</p>;
  }

  return (
    <form className="max-w-2xl space-y-4" onSubmit={onSave}>
      <div className="space-y-2">
        <Label htmlFor="help-intro">Intro text</Label>
        <textarea
          id="help-intro"
          className="min-h-[120px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground"
          value={data.intro}
          onChange={(e) => setData((prev) => ({ ...prev, intro: e.target.value }))}
          placeholder="Help intro shown to students."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="help-contact-title">Contact section title</Label>
        <Input
          id="help-contact-title"
          value={data.contactTitle}
          onChange={(e) => setData((prev) => ({ ...prev, contactTitle: e.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="help-phone">Phone</Label>
          <Input
            id="help-phone"
            value={data.phone}
            onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="help-email">Email</Label>
          <Input
            id="help-email"
            type="email"
            value={data.email}
            onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save help content"}
      </Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
