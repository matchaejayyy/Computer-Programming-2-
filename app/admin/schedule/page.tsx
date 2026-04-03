"use client";
import { useState } from "react";
import { Calendar, Ban, Clock, ChevronDown, Plus, X } from "lucide-react";
import { HomeLink } from "@/components/admin/admin-homelink";

export default function SchedulePage() {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("07:00 AM - 08:00 AM");
    const [schedules, setSchedules] = useState<any>({});
    const [blockedDates, setBlockedDates] = useState<string[]>([]);

    const timeOptions = [
        "07:00 AM - 08:00 AM", "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM",
        "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM",
        "04:00 PM - 05:00 PM"
    ];

    const addSlot = () => {
        if (!date || !time) return;
        if (blockedDates.includes(date)) {
            alert("This date is currently blocked.");
            return;
        }
        const updated = { ...schedules };
        if (!updated[date]) updated[date] = [];
        if (updated[date].includes(time)) return;
        
        updated[date].push(time);
        updated[date].sort((a: string, b: string) => timeOptions.indexOf(a) - timeOptions.indexOf(b));
        setSchedules(updated);
    };

    const blockDate = () => {
        if (!date) return;
        if (!blockedDates.includes(date)) {
            setBlockedDates([...blockedDates, date]);
            const updated = { ...schedules };
            delete updated[date];
            setSchedules(updated);
        } else {
            setBlockedDates(blockedDates.filter(d => d !== date));
        }
    };

    const totalSlots = Object.values(schedules).flat().length;
    

    return (
        <div className="p-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
            {/* HEADER AREA */}
            
            <div className="mb-8">
                
                {/* Back to dashboard button */}
                   <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                     <HomeLink />
                   </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manage Schedule</h1>
                <p className="text-sm text-gray-500">Review dates, time slots, and clinic availability.</p>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
                
                {/* SET SCHEDULE ROW (ALL IN ONE LINE) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Select Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-red-500 outline-none bg-gray-50/50"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 uppercase tracking-wide">Available Time Slots</label>
                        <div className="relative">
                            <select 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-red-500 outline-none bg-gray-50/50 appearance-none pr-10"
                            >
                                {timeOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                        </div>
                    </div>

                    <button 
                        onClick={addSlot} 
                        className="bg-red-600 text-white text-xs font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm shadow-red-100"
                    >
                        <Plus className="w-4 h-4" />
                        Add Slot
                    </button>

                    <button 
                        onClick={blockDate} 
                        className={`border text-xs font-bold py-3 px-4 rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                            blockedDates.includes(date) 
                            ? "bg-orange-50 text-orange-600 border-orange-200" 
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Ban className="w-4 h-4" />
                        {blockedDates.includes(date) ? "Unblock" : "Block Date"}
                    </button>
                </div>

                {/* STAT CARDS (INLINE WITH THE CONTAINER) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="p-2.5 bg-green-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">{Object.keys(schedules).length}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-1">Active Work Days</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="p-2.5 bg-orange-50 rounded-lg">
                            <Ban className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">{blockedDates.length}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-1">Blocked Dates</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="p-2.5 bg-red-50 rounded-lg">
                            <Clock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 leading-none">{totalSlots}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-1">Total Created Slots</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LOWER LIST SECTION */}
            <div>
                <div className="flex justify-between items-center mb-5 px-1">
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Active Schedules</h2>
                    <span className="text-[11px] text-gray-400 font-medium">{Object.keys(schedules).length + blockedDates.length} total records</span>
                </div>

                <div className="space-y-4">
                    {Object.keys(schedules).length === 0 && (
                        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-16 text-center shadow-sm">
                            <p className="text-sm text-gray-400">No active clinic hours found for the selected periods.</p>
                        </div>
                    )}

                    {Object.entries(schedules).map(([d, times]: any) => (
                        <div key={d} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-hover hover:shadow-md">
                            <div className="flex items-center gap-8">
                                <div className="min-w-[100px]">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Clinic Date</p>
                                    <p className="text-sm font-bold text-gray-900">{d}</p>
                                </div>
                                <div className="h-10 w-[1px] bg-gray-100" />
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Windows</p>
                                    <div className="flex flex-wrap gap-2">
                                        {times.map((t: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-gray-50 text-gray-700 font-bold px-3 py-1.5 rounded-lg border border-gray-100">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}