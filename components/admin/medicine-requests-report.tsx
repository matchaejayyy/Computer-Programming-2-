"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileSpreadsheet, Pill, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HomeLink } from "@/components/admin/admin-homelink";

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
  id: string;
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: string;
};

const sampleRequests: MedicineRequest[] = [
  {
    id: "MR-2026-001",
    studentId: "2024-0001",
    name: "John Doe",
    medication: "Paracetamol",
    quantity: 2,
    requestedAt: new Date().toLocaleString(),
  },
  {
    id: "MR-2026-002",
    studentId: "2024-0042",
    name: "Maria Cruz",
    medication: "Ibuprofen",
    quantity: 1,
    requestedAt: new Date().toLocaleString(),
  },
  {
    id: "MR-2026-003",
    studentId: "2024-0019",
    name: "Angel Santos",
    medication: "Cetirizine",
    quantity: 1,
    requestedAt: new Date().toLocaleString(),
  },
];

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Fulfilled: "bg-emerald-100 text-emerald-800",
  Denied: "bg-red-100 text-red-800",
};

export function MedicineRequestsReport() {
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<MedicineRequest[]>(sampleRequests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRequest, setEditRequest] = useState<MedicineRequest | null>(null);
  const [editDate, setEditDate] = useState(new Date().toISOString().split("T")[0]);
  const [editTime, setEditTime] = useState(new Date().toTimeString().slice(0, 5));

  // Quick Add Form State
  const [newRequest, setNewRequest] = useState({
    studentId: "",
    name: "",
    medication: "",
    quantity: 1,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = searchQuery === "" ||
        req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.medication.toLowerCase().includes(searchQuery.toLowerCase());
      const reqDate = req.requestedAt.split(" ")[0];
      const matchesDate = selectedDate === "" || reqDate === selectedDate;
      return matchesSearch && matchesDate;
    });
  }, [requests, searchQuery, selectedDate]);

  const medicationCounts = useMemo(() => {
    return Array.from(
      filteredRequests.reduce((map, req) => {
        map.set(req.medication, (map.get(req.medication) ?? 0) + 1);
        return map;
      }, new Map<string, number>())
    ).sort((a, b) => b[1] - a[1]);
  }, [filteredRequests]);

  const startEdit = (req: MedicineRequest) => {
    const [datePart, timePart] = req.requestedAt.split(" ");
    setEditingId(req.id);
    setEditRequest({ ...req });
    setEditDate(datePart || new Date().toISOString().split("T")[0]);
    setEditTime(timePart || new Date().toTimeString().slice(0, 5));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRequest(null);
  };

  const saveEdit = () => {
    if (!editRequest) return;
    if (!editRequest.studentId || !editRequest.name || !editRequest.medication || editRequest.quantity <= 0) return;

    setRequests(requests.map((req) =>
      req.id === editRequest.id
        ? { ...editRequest, requestedAt: `${editDate} ${editTime}` }
        : req
    ));
    cancelEdit();
  };

  const deleteRequest = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this medicine request?")) return;
    setRequests(requests.filter((req) => req.id !== id));
    if (editingId === id) cancelEdit();
  };

  const handleAddRequest = () => {
    if (!newRequest.studentId || !newRequest.name || !newRequest.medication || newRequest.quantity <= 0) return;

    const dateTimeStr = `${newRequest.date} ${newRequest.time}`;
    const newReq: MedicineRequest = {
      id: `MR-${Date.now()}`,
      studentId: newRequest.studentId,
      name: newRequest.name,
      medication: newRequest.medication,
      quantity: newRequest.quantity,
      requestedAt: dateTimeStr,
    };

    setRequests([newReq, ...requests]);
    setNewRequest({ studentId: "", name: "", medication: "", quantity: 1, date: new Date().toISOString().split("T")[0], time: new Date().toTimeString().slice(0, 5) });
  };

  const downloadCsv = () => {
    const headers = ["Request ID", "Student ID", "Student", "Medication", "Quantity", "Requested At"];
    const rows = filteredRequests.map((req) => [
      req.id,
      req.studentId,
      req.name,
      req.medication,
      `${req.quantity} tablets`,
      req.requestedAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medicine-requests-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
        <Button
          variant="secondary"
          className="gap-2"
          onClick={downloadCsv}
          type="button"
        >
          <FileSpreadsheet className="size-4" />
          Export CSV
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Medicine Request Analytic Report
        </h1>
      </div>

      {/* Quick Add Medicine Request */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Pill className="size-4" /> Quick Add Medicine Request
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
                onValueChange={(value) => setNewRequest({ ...newRequest, medication: value || "" })}
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
                </SelectContent>
              </Select>
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
              <Button variant="default" onClick={handleAddRequest} size="sm" className="w-full">
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medication Requests Summary */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            All medications requested for {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicationCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medicine requests for this date.</p>
          ) : (
            <div className="space-y-2">
              {medicationCounts.map(([medication, count]) => (
                <div key={medication} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                  <span>{medication}</span>
                  <span className="font-semibold">{count} request{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border border-border shadow-sm">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold">All</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelectedDate("")}
              >
                All
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Filter by Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Search by Name or Medicine</Label>
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Medicine requests for {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Requested At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {filteredRequests.map((request) => {
                const isEditing = editingId === request.id;

                return (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-foreground">{request.id}</td>
                    <td className="px-4 py-3">
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
                          <div>{request.name}</div>
                          <div className="text-xs text-muted-foreground">{request.studentId}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && editRequest ? (
                        <Select
                          value={editRequest.medication}
                          onValueChange={(value) => setEditRequest({ ...editRequest, medication: value || "" })}
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
                          </SelectContent>
                        </Select>
                      ) : (
                        request.medication
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing && editRequest ? (
                        <Input
                          type="number"
                          min="1"
                          value={editRequest.quantity}
                          onChange={(e) => setEditRequest({ ...editRequest, quantity: parseInt(e.target.value) || 1 })}
                        />
                      ) : (
                        `${request.quantity} tablets`
                      )}
                    </td>
                    <td className="px-4 py-3">
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
                        request.requestedAt
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {isEditing && editRequest ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={saveEdit}>
                            Save
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
                          <Button size="sm" variant="destructive" onClick={() => deleteRequest(request.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No medicine requests found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
