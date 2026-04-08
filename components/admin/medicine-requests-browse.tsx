"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, FileSpreadsheet, Loader2, Pill, Search, X } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const OTHERS_FILTER = "__others__";
const availableMedicinesSet = new Set(availableMedicines);

type MedicineRequest = {
  id: number;
  studentId: string;
  name: string;
  medication: string;
  quantity: number;
  requestedAt: string;
};

export function MedicineRequestsBrowse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [medicationFilter, setMedicationFilter] = useState("");
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/medicine-requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: MedicineRequest[] = await res.json();
      setRequests(data);
    } catch (err) {
      console.error("Fetch medicine requests error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    let result = requests;

    if (medicationFilter) {
      if (medicationFilter === OTHERS_FILTER) {
        result = result.filter((r) => !availableMedicinesSet.has(r.medication));
      } else {
        result = result.filter((r) => r.medication === medicationFilter);
      }
    }

    if (dateFrom) {
      result = result.filter((r) => {
        const reqDate = r.requestedAt.split(" ")[0];
        return reqDate >= dateFrom;
      });
    }

    if (dateTo) {
      result = result.filter((r) => {
        const reqDate = r.requestedAt.split(" ")[0];
        return reqDate <= dateTo;
      });
    }

    return result;
  }, [requests, medicationFilter, dateFrom, dateTo]);

  const medicationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const req of filteredRequests) {
      const label = availableMedicinesSet.has(req.medication) ? req.medication : "Others";
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map).sort((a, b) => b[1] - a[1]);
  }, [filteredRequests]);

  const hasActiveFilters = !!(searchQuery || dateFrom || dateTo || medicationFilter);

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setMedicationFilter("");
  };

  const downloadCsv = () => {
    const headers = ["Student ID", "Student", "Medication", "Quantity", "Requested At"];
    const rows = filteredRequests.map((req) => [
      req.studentId,
      req.name,
      req.medication,
      `${req.quantity} tablet${req.quantity === 1 ? "" : "s"}`,
      req.requestedAt,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medicine-requests-all.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filterLabel = (() => {
    const parts: string[] = [];
    if (dateFrom && dateTo) parts.push(`${dateFrom} to ${dateTo}`);
    else if (dateFrom) parts.push(`from ${dateFrom}`);
    else if (dateTo) parts.push(`until ${dateTo}`);
    if (medicationFilter) parts.push(medicationFilter);
    return parts.length > 0 ? parts.join(" · ") : "all dates";
  })();

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
        <div className="flex gap-2">
          <Link href="/admin/reports/medicine-requests">
            <Button variant="outline" className="gap-2" type="button">
              <Pill className="size-4" />
              Medicine Request
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={downloadCsv} type="button">
            <FileSpreadsheet className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Medicine Requests Analytic Report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search, filter, and browse all medicine requests across all dates.
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="size-4" /> Search &amp; Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold">Search by Name or Student ID</Label>
              <Input
                placeholder="Type a name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Medication</Label>
              <Select
                value={medicationFilter}
                onValueChange={(value) => setMedicationFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All medications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All medications</SelectItem>
                  {availableMedicines.map((med) => (
                    <SelectItem key={med} value={med}>
                      {med}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHERS_FILTER}>Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={clearFilters}>
                <X className="size-3.5" />
                Clear all filters
              </Button>
              <span className="text-xs text-muted-foreground">
                Showing {filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            All medications requested for {filterLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : medicationCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medicine requests found.</p>
          ) : (
            <div className="space-y-2">
              {medicationCounts.slice(0, 5).map(([medication, count]) => (
                <div
                  key={medication}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm"
                >
                  <span>{medication}</span>
                  <span className="font-semibold">
                    {count} request{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
              {medicationCounts.length > 5 && (
                <Link href="/admin/medicine-requests/medications">
                  <Button variant="ghost" size="sm" className="w-full gap-1.5 mt-1 text-muted-foreground hover:text-foreground">
                    Show more ({medicationCounts.length - 5} more medication{medicationCounts.length - 5 !== 1 ? "s" : ""})
                    <ChevronRight className="size-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Medicine requests for {filterLabel}
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {filteredRequests.length} record{filteredRequests.length !== 1 ? "s" : ""}
            </span>
          </div>
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
                  <th className="px-5 py-4 text-left">Student ID</th>
                  <th className="px-5 py-4 text-left">Student Name</th>
                  <th className="px-5 py-4 text-left">Medication</th>
                  <th className="px-5 py-4 text-center w-24">Qty</th>
                  <th className="px-5 py-4 text-center">Requested At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-5 py-5 text-muted-foreground">{request.studentId}</td>
                    <td className="px-5 py-5 font-medium">{request.name}</td>
                    <td className="px-5 py-5">{request.medication}</td>
                    <td className="px-5 py-5 text-center">
                      {request.quantity} tablet{request.quantity === 1 ? "" : "s"}
                    </td>
                    <td className="px-5 py-5 text-center">
                      {(() => {
                        const [datePart, timePart] = request.requestedAt.split(" ");
                        const formattedDate = new Date(datePart).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                        const formattedTime = new Date(`2000-01-01T${timePart}:00`).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                        return `${formattedDate} at ${formattedTime}`;
                      })()}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No medicine requests found for the selected filters.
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
