"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { RequestStatus } from "@/lib/utils/constants/mock-requests";

type Props = {
  updateId: number;
  status: RequestStatus;
  initialNote?: string;
  onUpdated: () => void | Promise<void>;
  /** Called after a successful approve or reject (e.g. clear URL query). */
  afterDecision?: () => void;
};

export function AdminAppointmentReviewActions({
  updateId,
  status,
  initialNote,
  onUpdated,
  afterDecision,
}: Props) {
  const [open, setOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(initialNote ?? "");
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "pending") {
    return null;
  }

  async function submitDecision(decision: "approved" | "rejected") {
    setPendingAction(decision);
    setError(null);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateId,
          status: decision,
          adminNote: noteDraft.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      setOpen(false);
      setNoteDraft("");
      await onUpdated();
      afterDecision?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <Separator />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {open ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
          <Label htmlFor={`clinic-note-${updateId}`} className="text-sm font-medium">
            Note for the student (optional)
          </Label>
          <textarea
            id={`clinic-note-${updateId}`}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="You can leave this blank."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="default"
              className="min-h-10 w-full sm:w-auto"
              disabled={pendingAction !== null}
              onClick={() => void submitDecision("approved")}
            >
              {pendingAction === "approved" ? "Saving…" : "Approve"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-10 w-full sm:w-auto"
              disabled={pendingAction !== null}
              onClick={() => void submitDecision("rejected")}
            >
              {pendingAction === "rejected" ? "Saving…" : "Reject"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-10 w-full sm:w-auto"
              onClick={() => {
                setOpen(false);
                setNoteDraft(initialNote ?? "");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="default"
          className="min-h-10 w-full sm:w-auto"
          onClick={() => {
            setOpen(true);
            setNoteDraft(initialNote ?? "");
            setError(null);
          }}
        >
          Approve / reject
        </Button>
      )}
    </>
  );
}
