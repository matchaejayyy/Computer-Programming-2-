'use client'

import { useEffect, useMemo, useState } from 'react'
import { 
  Clock3, FileSpreadsheet, Filter
} from 'lucide-react'
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { HomeLink } from "@/components/admin/dashboard/HomeLink";

type VisitorLog = {
  id: string;
  name: string;
  email: string;
  department: string;
  course: string;
  year: string;
  purpose: string;
  time: string;
  createdAt: string;
}

function isoDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }
  return parsed.toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        const response = await fetch('/api/admin/visitor-logs')
        const payload = (await response.json()) as { logs?: VisitorLog[]; error?: string }
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load visit history.')
        }
        const logs = Array.isArray(payload.logs) ? payload.logs : []

        if (!cancelled) {
          setVisitorLogs(logs)
        }
      } catch (error) {
        if (!cancelled) {
          setVisitorLogs([])
          setLoadError(error instanceof Error ? error.message : 'Could not load visit history.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visitorLogs.filter(log => {
      if (selectedDate) {
        const entryDate = isoDate(log.createdAt)
        if (entryDate !== selectedDate) return false
      }
      if (!q) return true
      return (
        log.name.toLowerCase().includes(q) ||
        log.email.toLowerCase().includes(q) ||
        log.department.toLowerCase().includes(q) ||
        log.course.toLowerCase().includes(q) ||
        log.year.toLowerCase().includes(q) ||
        log.purpose.toLowerCase().includes(q)
      )
    })
  }, [visitorLogs, selectedDate, search])

  const todayISO = new Date().toISOString().slice(0, 10)
  const stats = {
    total: visitorLogs.length,
    today: visitorLogs.filter((log) => isoDate(log.createdAt) === todayISO).length,
    filtered: filteredLogs.length,
  }

  const downloadReport = () => {
    if (filteredLogs.length === 0) {
      alert("No records to export!");
      return;
    }

    const headers = ["Record ID", "Name", "Email", "Department", "Course", "Year", "Time", "Purpose", "Date"];

    const rows = filteredLogs.map(log => [
      log.id,
      log.name,
      log.email,
      log.department,
      log.course,
      log.year,
      log.time,
      log.purpose,
      new Date(log.createdAt).toLocaleDateString()
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.map(value => `"${value}"`).join(","))
    ].join("\n");

    // 4. Create the download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `Clinic_Report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    
    URL.revokeObjectURL(url);
  };


  return (
    <div className="grid grid-cols-1 gap-2">
      
      {/* --- TOP NAVIGATION --- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HomeLink />
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
          onClick={() => downloadReport()}
          type="button"
        >
          <FileSpreadsheet className="size-4" /> 
          Export CSV
        </Button>
      </div>

      {/* --- PAGE HEADER --- */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Clinic Visit Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This visit history is based on Visitor Log entries.
        </p>
      </div>

      {/* --- SECTION: FILTERS --- */}
      <Card className="mb-4 border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-bold">Filter by Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-bold">Search</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, department, course, year, purpose"
              />
            </div>
            <Button 
              variant="outline" 
              className="shrink-0 gap-2"
              onClick={() => { setSelectedDate(''); setSearch(''); }}
            >
              <Filter className="size-4" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- SECTION: SUMMARY STATS --- */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard icon={Clock3} label="Total Logs" value={stats.total} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock3} label="Today" value={stats.today} color="bg-green-50 text-green-600" />
        <StatCard icon={Clock3} label="Filtered" value={stats.filtered} color="bg-amber-50 text-amber-600" />
      </div>

      {/* --- SECTION: RECORD LIST  --- */}
      <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Visit History</h2>
          <span className="text-sm text-muted-foreground">{filteredLogs.length} total</span>
        </div>

        {loadError ? (
          <div className="text-center py-12 border rounded-xl text-red-600">
            {loadError}
          </div>
        ) : loading ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            Loading visit history...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            No records match your filters.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredLogs.map((log) => {
              return (
                <Card key={log.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="flex flex-col md:flex-row border-b border-border">
                    <div className="bg-muted/30 px-5 py-3 flex items-center justify-between md:w-64 border-b md:border-b-0 md:border-r">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Record ID</span>
                        <p className="font-mono text-sm font-semibold">{log.id}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-between bg-white">
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
                          <DataPoint label="Patient" value={log.name} />
                          <DataPoint label="Email" value={log.email} />
                          <DataPoint label="Department" value={log.department} />
                          <DataPoint label="Course & Year" value={`${log.course} - ${log.year}`} />
                          <DataPoint label="Time" value={log.time} />
                          <DataPoint label="Purpose" value={log.purpose} />
                       </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("p-2.5 rounded-lg", color)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}