"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";

import { HomeLink } from "@/components/clinic/home-link";
import { ProfilePatientDetails } from "@/components/clinic/profile-patient-details";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  const [editingEnabled, setEditingEnabled] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
      </div>
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardAction>
            <Button
              type="button"
              variant={editingEnabled ? "outline" : "default"}
              size="icon"
              onClick={() => setEditingEnabled((prev) => !prev)}
              aria-label={editingEnabled ? "Disable editing" : "Enable editing"}
              title={editingEnabled ? "Disable editing" : "Enable editing"}
            >
              {editingEnabled ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </CardAction>
          <CardTitle className="text-lg text-foreground">Profile</CardTitle>
          <CardDescription>
            View and update your student profile, contact information, and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <ProfilePatientDetails
            editingEnabled={editingEnabled}
            onEditingEnabledChange={setEditingEnabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}
