"use client";

import { useCallback, useEffect, useState } from "react";
import { List, Loader2, Pill } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HomeLink } from "@/components/admin/dashboard/HomeLink";

const availableMedicines = [
  "Paracetamol",
  "Ibuprofen",
  "Mefenamic Acid",
  "Neozep (Tablets)",
  "Bioflu (Tablets)",
  "Cetirizine",
  "Loratadine",
  "Lagundi",
  "Kremil-S (Antacid)",
  "Buscopan (Hyoscine)",
  "Diatabs (Loperamide)",
  "Hydrite (ORS)",
  "Ambroxol",
  "Guaifenesin",
  "Vitamin C",
  "Iron (Ferrous)",
  "Deworming (Antiox)",
];

type MedicineRequest = {
  id: number;
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: string;
};

const OTHERS_VALUE = "__others__";

const today = () => new Date().toISOString().split("T")[0];

export function MedicineRequestsReport() {
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRequest, setEditRequest] = useState<MedicineRequest | null>(null);
  const [editDate, setEditDate] = useState(today());
  const [editTime, setEditTime] = useState(new Date().toTimeString().slice(0, 5));
  const [editCustomMedication, setEditCustomMedication] = useState("");
  const [editMedicationSelect, setEditMedicationSelect] = useState("");

  const [customMedication, setCustomMedication] = useState("");
  const [newRequest, setNewRequest] = useState({
    studentId: "",
    name: "",
    medication: "",
    quantity: 1,
    date: today(),
    time: new Date().toTimeString().slice(0, 5),
  });

  const fetchTodayRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("date", today());
      const res = await fetch(`/api/admin/medicine-requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: MedicineRequest[] = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Fetch medicine requests error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayRequests();
  }, [fetchTodayRequests]);

  const handleAddRequest = async () => {
    const finalMedication = newRequest.medication === OTHERS_VALUE ? customMedication.trim() : newRequest.medication;
    if (!newRequest.studentId || !newRequest.name || !finalMedication || newRequest.quantity <= 0) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/medicine-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRequest, medication: finalMedication }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const created: MedicineRequest = await res.json();
      const createdDate = created.requestedAt.split(" ")[0];
      if (createdDate === today()) {
        setRequests((prev) => [created, ...prev]);
      }

      setCustomMedication("");
      setNewRequest({
        studentId: "",
        name: "",
        medication: "",
        quantity: 1,
        date: today(),
        time: new Date().toTimeString().slice(0, 5),
      });
    } catch (err) {
      console.error("Add medicine request error:", err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (req: MedicineRequest) => {
    const [datePart, timePart] = req.requestedAt.split(" ");
    setEditingId(req.id);
    const isOther = !availableMedicines.includes(req.medication);
    setEditMedicationSelect(isOther ? OTHERS_VALUE : req.medication);
    setEditCustomMedication(isOther ? req.medication : "");
    setEditRequest({ ...req });
    setEditDate(datePart || today());
    setEditTime(timePart || new Date().toTimeString().slice(0, 5));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRequest(null);
    setEditMedicationSelect("");
    setEditCustomMedication("");
  };

  const saveEdit = async () => {
    if (!editRequest) return;
    const finalMedication = editMedicationSelect === OTHERS_VALUE ? editCustomMedication.trim() : editMedicationSelect;
    if (!editRequest.studentId || !editRequest.name || !finalMedication || editRequest.quantity <= 0) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/medicine-requests/${editRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editRequest.studentId,
          name: editRequest.name,
          medication: finalMedication,
          quantity: editRequest.quantity,
          date: editDate,
          time: editTime,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated: MedicineRequest = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      cancelEdit();
    } catch (err) {
      console.error("Update medicine request error:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteRequest = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this medicine request?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/medicine-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      console.error("Delete medicine request error:", err);
    } finally {
      setSaving(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
        <Link href="/admin/medicine-requests">
          <Button variant="outline" className="gap-2" type="button">
            <List className="size-4" />
            Medicine Requests Analytic Report
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Medicine Request
        </h1>
      </div>

      {/* Quick Add Medicine Request */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Pill className="size-4" /> Add to the list
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Student ID</Label>
              <Input
                placeholder="2024-0000"
                value={newRequest.studentId}
                onChange={(e) => setNewRequest({ ...newRequest, studentId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input
                placeholder="Student Name"
                value={newRequest.name}
                onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Medication</Label>
              <Select
                value={newRequest.medication}
                onValueChange={(value) => {
                  setNewRequest({ ...newRequest, medication: value || "" });
                  if (value !== OTHERS_VALUE) setCustomMedication("");
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select medicine" />
                </SelectTrigger>
                <SelectContent>
                  {availableMedicines.map((med) => (
                    <SelectItem key={med} value={med}>
                      {med}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHERS_VALUE}>Others</SelectItem>
                </SelectContent>
              </Select>
              {newRequest.medication === OTHERS_VALUE && (
                <Input
                  placeholder="Enter medication name"
                  value={customMedication}
                  onChange={(e) => setCustomMedication(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={newRequest.quantity}
                onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={newRequest.date}
                onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Time</Label>
              <Input
                type="time"
                value={newRequest.time}
                onChange={(e) => setNewRequest({ ...newRequest, time: e.target.value })}
              />
            </div>
            <div className="flex items-end h-full">
              <Button
                variant="default"
                onClick={handleAddRequest}
                size="sm"
                className="w-full"
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Requests Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Medicine requests for today — {todayFormatted}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 text-left">Student</th>
                  <th className="px-5 py-4 text-left">Medication</th>
                  <th className="px-5 py-4 text-center w-24">Qty</th>
                  <th className="px-5 py-4 text-center">Requested At</th>
                  <th className="px-5 py-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {requests.map((request) => {
                  const isEditing = editingId === request.id;

                  return (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-5 py-5">
                        {isEditing && editRequest ? (
                          <div className="space-y-2">
                            <Input
                              value={editRequest.studentId}
                              onChange={(e) => setEditRequest({ ...editRequest, studentId: e.target.value })}
                            />
                            <Input
                              value={editRequest.name}
                              onChange={(e) => setEditRequest({ ...editRequest, name: e.target.value })}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{request.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{request.studentId}</div>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        {isEditing && editRequest ? (
                          <div className="space-y-2">
                            <Select
                              value={editMedicationSelect}
                              onValueChange={(value) => {
                                setEditMedicationSelect(value || "");
                                if (value !== OTHERS_VALUE) {
                                  setEditCustomMedication("");
                                  setEditRequest({ ...editRequest, medication: value || "" });
                                }
                              }}
                            >
                              <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="Select medicine" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMedicines.map((med) => (
                                  <SelectItem key={med} value={med}>
                                    {med}
                                  </SelectItem>
                                ))}
                                <SelectItem value={OTHERS_VALUE}>Others</SelectItem>
                              </SelectContent>
                            </Select>
                            {editMedicationSelect === OTHERS_VALUE && (
                              <Input
                                placeholder="Enter medication name"
                                value={editCustomMedication}
                                onChange={(e) => setEditCustomMedication(e.target.value)}
                              />
                            )}
                          </div>
                        ) : (
                          request.medication
                        )}
                      </td>
                      <td className="px-5 py-5 text-center">
                        {isEditing && editRequest ? (
                          <Input
                            type="number"
                            min="1"
                            value={editRequest.quantity}
                            onChange={(e) => setEditRequest({ ...editRequest, quantity: parseInt(e.target.value) || 1 })}
                          />
                        ) : (
                          `${request.quantity} tablet${request.quantity === 1 ? "" : "s"}`
                        )}
                      </td>
                      <td className="px-5 py-5 text-center">
                        {isEditing && editRequest ? (
                          <div className="grid gap-2">
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                            />
                            <Input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                            />
                          </div>
                        ) : (
                          (() => {
                            const [datePart, timePart] = request.requestedAt.split(" ");
                            const formattedDate = new Date(datePart).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                            const formattedTime = new Date(`2000-01-01T${timePart}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                            return `${formattedDate} at ${formattedTime}`;
                          })()
                        )}
                      </td>
                      <td className="px-5 py-5 text-center">
                        <div className="inline-flex gap-2">
                          {isEditing && editRequest ? (
                            <>
                              <Button size="sm" variant="secondary" onClick={saveEdit} disabled={saving}>
                                {saving ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => startEdit(request)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteRequest(request.id)} disabled={saving}>
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No medicine requests for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
