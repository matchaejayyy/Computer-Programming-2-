'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Calendar, CheckCircle, XCircle, AlertCircle, 
  Plus, FileSpreadsheet, Filter, ChevronLeft, Search 
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { HomeLink } from "@/components/admin/admin-homelink";

/* ================= TYPES ================= */

type PatientLog = {
  id: string;
  studentId: string;
  name: string;
  reason: string;
  status: 'completed' | 'cancelled' | 'noShow' | 'pending';
  createdAt: string;
}

/* ================= STATUS CONFIG ================= */

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    badgeClass: 'border-green-600 bg-green-600 text-white',
    bgIcon: 'bg-green-50 text-green-600'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    bgIcon: 'bg-amber-50 text-amber-600'
  },
  noShow: {
    label: 'No Show',
    icon: AlertCircle,
    badgeClass: 'border-red-200 bg-red-50 text-red-800',
    bgIcon: 'bg-red-50 text-red-600'
  },
  pending: {
    label: 'Pending',
    icon: Calendar,
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
    bgIcon: 'bg-blue-50 text-blue-600'
  }
}

export default function ReportsPage() {
  const [patientLogs, setPatientLogs] = useState<PatientLog[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Quick-Add Form State
  const [newVisit, setNewVisit] = useState({
    studentId: '',
    name: '',
    reason: 'Consultation',
    customReason: '' 
  })

  // 1. BACKEND FETCH (Simulated/API)
  useEffect(() => {
    // In a real app, this fetch would use the selectedDate
    // fetch(`/api/reports?date=${selectedDate}`)...
    setPatientLogs([
      { id: 'REC-1024', studentId: '2021-0001', name: 'John Doe', reason: 'Consultation', status: 'pending', createdAt: new Date().toISOString() },
      { id: 'REC-1025', studentId: '2021-0054', name: 'Jane Smith', reason: 'OTC Medicine', status: 'completed', createdAt: new Date().toISOString() }
    ])
  }, [selectedDate])

  // 2. FILTER LOGIC (Client-side filtering for Status)
  const filteredLogs = useMemo(() => {
    return patientLogs.filter(log => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      return true;
    })
  }, [patientLogs, statusFilter])

  // 3. STATS CALCULATION (Based on filtered results)
  const stats = {
    total: filteredLogs.length,
    completed: filteredLogs.filter(l => l.status === 'completed').length,
    cancelled: filteredLogs.filter(l => l.status === 'cancelled').length,
    noShow: filteredLogs.filter(l => l.status === 'noShow').length,
  }

  /* --- HANDLERS --- */

  const handleAddVisit = () => {
    if (!newVisit.studentId || !newVisit.name) return;
    const finalReason = newVisit.reason === 'Other' ? (newVisit.customReason || 'Other') : newVisit.reason;

    const newLog: PatientLog = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: newVisit.studentId,
      name: newVisit.name,
      reason: finalReason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setPatientLogs([newLog, ...patientLogs]);
    setNewVisit({ studentId: '', name: '', reason: 'Consultation', customReason: '' });
  }

  const handleStatusChange = (id: string, newStatus: PatientLog['status']) => {
    setPatientLogs(logs => logs.map(log => log.id === id ? { ...log, status: newStatus } : log));
  }
  const downloadReport = () => {
    console.log("Exporting CSV for:", patientLogs); // Debug: Check if this fires

    if (patientLogs.length === 0) {
      alert("No records to export!");
      return;
    }

    const headers = ["Record ID", "Student ID", "Name", "Reason", "Status", "Date"];

    const rows = patientLogs.map(log => [
      log.id,
      log.studentId,
      log.name,
      log.reason,
      log.status.toUpperCase(),
      selectedDate
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
        <p className="mt-1 text-sm text-muted-foreground">Track daily patient walk-ins and appointment outcomes.</p>
      </div>

      {/* --- SECTION: QUICK ADD  --- */}
      <Card className="mb-4 border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="size-4" /> Quick Add Walk-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs">Student ID</Label>
              <Input 
                placeholder="2024-0000" 
                value={newVisit.studentId}
                onChange={e => setNewVisit({...newVisit, studentId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input 
                placeholder="Student Name" 
                value={newVisit.name}
                onChange={e => setNewVisit({...newVisit, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reason for Visit</Label>
              <div className="flex gap-2">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newVisit.reason}
                  onChange={e => setNewVisit({...newVisit, reason: e.target.value})}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="MedCert">MedCert</option>
                  <option value="OTC Medicine">OTC Medicine</option>
                  <option value="Other">Other</option>
                </select>
                {newVisit.reason === 'Other' && (
                  <Input 
                    placeholder="Specify..." 
                    className="w-1/2"
                    value={newVisit.customReason}
                    onChange={e => setNewVisit({...newVisit, customReason: e.target.value})}
                  />
                )}
              </div>
            </div>
            <Button onClick={handleAddVisit} className="w-full">Add to Log</Button>
          </div>
        </CardContent>
      </Card>

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
              <Label className="text-xs font-bold">Filter by Status</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="noShow">No Show</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="shrink-0 gap-2"
              onClick={() => { setStatusFilter('all'); setSelectedDate(new Date().toISOString().split('T')[0]); }}
            >
              <Filter className="size-4" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- SECTION: SUMMARY STATS --- */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard icon={CheckCircle} label="Completed" value={stats.completed} color="bg-green-50 text-green-600" />
        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} color="bg-amber-50 text-amber-600" />
        <StatCard icon={AlertCircle} label="No Show" value={stats.noShow} color="bg-red-50 text-red-600" />
      </div>

      {/* --- SECTION: RECORD LIST  --- */}
      <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Visit History</h2>
          <span className="text-sm text-muted-foreground">{filteredLogs.length} total</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            No records match your filters.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredLogs.map((log) => {
              const config = statusConfig[log.status];
              const Icon = config.icon;


              return (
                <Card key={log.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="flex flex-col md:flex-row border-b border-border">
                    <div className="bg-muted/30 px-5 py-3 flex items-center justify-between md:w-64 border-b md:border-b-0 md:border-r">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Record ID</span>
                        <p className="font-mono text-sm font-semibold">{log.id}</p>
                      </div>
                      <Badge className={cn("gap-1", config.badgeClass)}>
                        <Icon className="size-3" /> {config.label}
                      </Badge>
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-between bg-white">
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1">
                          <DataPoint label="Patient" value={log.name} />
                          <DataPoint label="ID Number" value={log.studentId} />
                          <DataPoint label="Reason" value={log.reason} />
                       </div>
                       <div className="pl-4">
                          <select 
                            className="text-xs border rounded-md px-2 py-1 bg-white cursor-pointer"
                            value={log.status}
                            onChange={(e) => handleStatusChange(log.id, e.target.value as PatientLog['status'])}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="noShow">No Show</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
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

/* --- REUSABLE COMPONENTS --- */

function StatCard({ icon: Icon, label, value, color }: any) {
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