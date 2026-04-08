"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
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

export function MedicineRequestsMedications() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [medicationFilter, setMedicationFilter] = useState("");
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/medicine-requests");
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

  const totalRequests = useMemo(
    () => medicationCounts.reduce((sum, [, count]) => sum + count, 0),
    [medicationCounts],
  );

  const hasActiveFilters = !!(dateFrom || dateTo || medicationFilter);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMedicationFilter("");
  };

  const filterLabel = (() => {
    const parts: string[] = [];
    if (dateFrom && dateTo) parts.push(`${dateFrom} to ${dateTo}`);
    else if (dateFrom) parts.push(`from ${dateFrom}`);
    else if (dateTo) parts.push(`until ${dateTo}`);
    if (medicationFilter) {
      parts.push(medicationFilter === OTHERS_FILTER ? "Others" : medicationFilter);
    }
    return parts.length > 0 ? parts.join(" · ") : "all dates";
  })();

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link href="/admin/medicine-requests">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          All Medications Requested
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View all medication counts. Filter by medication or date range.
        </p>
      </div>

      {/* Filters */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="size-4" /> Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full medication counts */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              All medications requested for {filterLabel}
            </CardTitle>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalRequests} total request{totalRequests !== 1 ? "s" : ""} · {medicationCounts.length} medication{medicationCounts.length !== 1 ? "s" : ""}
            </span>
          </div>
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
              {medicationCounts.map(([medication, count]) => {
                const percentage = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
                return (
                  <div
                    key={medication}
                    className="relative flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-sm overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-neutral-200/50 rounded-xl transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="relative z-10 font-medium">{medication}</span>
                    <span className="relative z-10 font-semibold tabular-nums">
                      {count} request{count !== 1 ? "s" : ""}{" "}
                      <span className="text-muted-foreground font-normal">({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
