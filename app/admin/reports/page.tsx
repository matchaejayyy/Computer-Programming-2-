'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, XCircle, AlertCircle, Plus, FileSpreadsheet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ================= TYPES ================= */

type PatientLog = {
  id: string;
  studentId: string;
  name: string;
  reason: string; // Changed to string to allow custom "Other" reasons
  status: 'completed' | 'cancelled' | 'noShow' | 'pending';
}

type ReportData = {
  totalPatients: number
  todayAppointments: number
  medicineStats: Record<string, number>
  completed: number
  cancelled: number
  noShow: number
}

/* ================= STATUS CONFIG ================= */

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-50 text-green-600',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-amber-50 text-amber-600',
  },
  noShow: {
    label: 'No Show',
    icon: AlertCircle,
    color: 'bg-red-50 text-red-600',
  },
  pending: {
    label: 'Pending',
    icon: Calendar,
    color: 'bg-blue-50 text-blue-600',
  }
}

/* ================= PAGE ================= */


export default function ReportsPage() {
  const [data, setData] = useState<ReportData>({
    totalPatients: 0,
    todayAppointments: 0,
    medicineStats: {},
    completed: 0,
    cancelled: 0,
    noShow: 0,
  })

  const [patientLogs, setPatientLogs] = useState<PatientLog[]>([])
  
  // State for Quick-Add Form with custom reason tracking
  const [newVisit, setNewVisit] = useState({
    studentId: '',
    name: '',
    reason: 'Consultation',
    customReason: '' 
  })

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetch(`/api/reports?date=${selectedDate}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to fetch reports", err))
      
    // Initial mock data
    setPatientLogs([
      { id: '1', studentId: '2021-0001', name: 'John Doe', reason: 'Consultation', status: 'pending' },
      { id: '2', studentId: '2021-0054', name: 'Jane Smith', reason: 'OTC Medicine', status: 'completed' }
    ])
  }, [selectedDate])

  /* --- HANDLERS --- */

  const handleAddVisit = () => {
    if (!newVisit.studentId || !newVisit.name) return;

    // Use custom reason if "Other" is selected, otherwise use dropdown value
    const finalReason = newVisit.reason === 'Other' 
      ? (newVisit.customReason || 'Other') 
      : newVisit.reason;

    const newLog: PatientLog = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: newVisit.studentId,
      name: newVisit.name,
      reason: finalReason,
      status: 'pending'
    };

    setPatientLogs([newLog, ...patientLogs]);
    
    setData(prev => ({
      ...prev,
      totalPatients: prev.totalPatients + 1,
      todayAppointments: prev.todayAppointments + 1
    }));

    // Reset form
    setNewVisit({ studentId: '', name: '', reason: 'Consultation', customReason: '' });
  }

  const handleStatusChange = (id: string, newStatus: PatientLog['status']) => {
    setPatientLogs(logs => logs.map(log => 
      log.id === id ? { ...log, status: newStatus } : log
    ));
  }

  // --- DOWNLOAD CSV LOGIC ---
  const downloadReport = () => {
    const headers = ["Student ID", "Name", "Reason", "Status", "Date"];
    const rows = patientLogs.map(log => [
      `"${log.studentId}"`,
      `"${log.name}"`,
      `"${log.reason}"`,
      `"${log.status.toUpperCase()}"`,
      `"${selectedDate}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Clinic_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 gap-6">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Reports & Tracking</h1>
          <p className="text-sm text-muted-foreground">Manage walk-ins and track daily statistics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Calendar className="size-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* QUICK ADD FORM */}
      <Card className="border shadow-sm bg-muted/30">
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1 flex-1 min-w-[150px]">
            <label className="text-xs font-semibold text-muted-foreground">Student ID</label>
            <input 
              className="w-full border rounded-md px-3 py-2 text-sm" 
              placeholder="e.g. 2024-0123" 
              value={newVisit.studentId}
              onChange={e => setNewVisit({...newVisit, studentId: e.target.value})}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground">Name</label>
            <input 
              className="w-full border rounded-md px-3 py-2 text-sm" 
              placeholder="Student Name" 
              value={newVisit.name}
              onChange={e => setNewVisit({...newVisit, name: e.target.value})}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground">Reason</label>
            <div className="flex gap-2">
                <select 
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newVisit.reason}
                onChange={e => setNewVisit({...newVisit, reason: e.target.value})}
                >
                <option value="Consultation">Consultation</option>
                <option value="MedCert">MedCert</option>
                <option value="OTC Medicine">OTC Medicine</option>
                <option value="Other">Other</option>
                </select>

                {newVisit.reason === 'Other' && (
                    <input 
                        className="w-full border rounded-md px-3 py-2 text-sm" 
                        placeholder="Specify reason..." 
                        value={newVisit.customReason}
                        onChange={e => setNewVisit({...newVisit, customReason: e.target.value})}
                        autoFocus
                    />
                )}
            </div>
          </div>
          <Button onClick={handleAddVisit} className="gap-2">
            <Plus className="size-4" /> Add Walk-in
          </Button>
        </CardContent>
      </Card>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border shadow-sm bg-blue-50/50">
          <CardContent className="flex items-center gap-5 py-5 px-6">
             <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Calendar className="size-5" />
             </div>
             <div>
                <p className="text-2xl font-bold">{data.todayAppointments}</p>
                <p className="text-xs text-muted-foreground">Total Today</p>
             </div>
          </CardContent>
        </Card>

        {['completed', 'cancelled', 'noShow'].map((key) => {
          const config = statusConfig[key as keyof typeof statusConfig]
          const Icon = config.icon
          const val = data[key as keyof ReportData] as number

          return (
            <Card key={key} className="border shadow-sm">
              <CardContent className="flex items-center gap-5 py-5 px-6">
                <div className={cn("flex size-10 items-center justify-center rounded-lg", config.color)}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* PATIENT LOGS TABLE */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Daily Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Student ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-md text-right">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {patientLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">No visits logged today.</td>
                  </tr>
                ) : (
                  patientLogs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{log.studentId}</td>
                      <td className="px-4 py-3">{log.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-normal">{log.reason}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig[log.status].color)}>
                          {statusConfig[log.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select 
                          className="border rounded text-xs px-2 py-1 bg-background cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                          value={log.status}
                          onChange={(e) => handleStatusChange(log.id, e.target.value as PatientLog['status'])}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="noShow">No Show</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DOWNLOAD SECTION */}
      <div className="flex justify-end pt-4">
        <Button 
            onClick={downloadReport} 
            variant="default" 
            className="gap-2 bg-green-700 hover:bg-green-800"
            disabled={patientLogs.length === 0}
        >
          <FileSpreadsheet className="size-4" />
          Download End-of-Day Report (.CSV)
        </Button>
      </div>

    </div>
  )
}