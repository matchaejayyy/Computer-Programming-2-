'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const [data, setData] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    medicineStats: {} as Record<string, number>
  })

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <Card className="border-0 bg-[#E50000] text-white rounded-2xl">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">Reports & Statistics</h1>
          <p className="text-sm">
            View clinic analytics and download reports
          </p>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Card>
          <CardHeader>
            <CardTitle>Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalPatients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.todayAppointments}</p>
          </CardContent>
        </Card>

      </div>

      {/* MEDICINE ANALYTICS */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Request Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(data.medicineStats).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b py-2">
                <span>{key}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DOWNLOAD */}
      <Button
        className="bg-[#1d4ed8] text-white"
        onClick={() => window.open('/api/reports/download')}
      >
        Download Report
      </Button>

    </div>
  )
}