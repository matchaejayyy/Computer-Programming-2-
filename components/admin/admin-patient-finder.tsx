"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PatientRow = {
  studentId: string;
  name: string;
  email: string;
  schoolIdNumber: string;
};

type Props = {
  className?: string;
};

export function AdminPatientFinder({ className }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [list, setList] = useState<PatientRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 320);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    setListLoading(true);
    setListError(null);
    fetch(`/api/admin/patients?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        if (!body?.success) throw new Error(body?.error || "Failed to load list.");
        setList(body.patients as PatientRow[]);
      })
      .catch((e) => {
        setList([]);
        setListError(e instanceof Error ? e.message : "Failed to load list.");
      })
      .finally(() => setListLoading(false));
  }, [debouncedQuery]);

  const hint = useMemo(() => {
    if (debouncedQuery) return `${list.length} match${list.length === 1 ? "" : "es"}`;
    return "All registered student accounts — use search to narrow the list";
  }, [debouncedQuery, list.length]);

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      <Card className="w-full min-w-0 border border-border shadow-sm">
        <CardContent className="space-y-2 p-4 sm:p-5 md:p-6">
          <Label htmlFor="patient-finder-search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="patient-finder-search"
            type="search"
            placeholder="Name, school ID, email, or login (student ID)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-md text-base sm:h-12 sm:text-lg"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>
        </CardContent>
      </Card>

      {listLoading ? (
        <Card className="w-full min-w-0 border border-border shadow-sm">
          <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground sm:py-12 sm:text-base">
            <Loader2 className="mx-auto size-6 animate-spin text-foreground/60" aria-hidden />
            <p className="font-medium text-foreground">Loading accounts</p>
            <p>One moment…</p>
          </CardContent>
        </Card>
      ) : listError ? (
        <Card className="w-full min-w-0 border border-border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-destructive sm:text-base" role="alert">
              {listError}
            </p>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="w-full min-w-0 border border-border shadow-sm">
          <CardContent className="space-y-2 py-10 text-center text-sm text-muted-foreground sm:py-12 sm:text-base">
            <p className="font-medium text-foreground">No student accounts match this search</p>
            <p>Try another name, school ID, email, or login.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((row) => (
            <li key={`${row.studentId}-${row.email}`} className="min-w-0">
              <Card className="h-full min-w-0 border border-border shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <Link
                    href={`/admin/patient-finder/${encodeURIComponent(row.studentId)}`}
                    className={cn(
                      "block h-full w-full px-4 py-4 text-left sm:px-5 sm:py-5 md:px-6 md:py-6",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65a30d] focus-visible:ring-offset-2"
                    )}
                  >
                    <span className="block text-base font-semibold text-foreground sm:text-lg md:text-xl">
                      {row.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground sm:text-base">
                      {row.email}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground sm:text-sm">
                      Login:{" "}
                      <span className="font-mono text-foreground/90">{row.studentId}</span>
                    </span>
                    {row.schoolIdNumber ? (
                      <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                        School ID: {row.schoolIdNumber}
                      </span>
                    ) : null}
                    <span className="mt-4 inline-block text-sm font-semibold text-red-700 underline underline-offset-4 sm:text-base">
                      View account details
                    </span>
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
