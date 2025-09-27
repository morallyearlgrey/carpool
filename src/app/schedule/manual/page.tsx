"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';

type DayName = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';

const weekdays: DayName[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function ManualSchedulePage(){
    const { data: session, status } = useSession();
    const isLoggedIn = status === 'authenticated';

    const [slots, setSlots] = useState(weekdays.map(day=>({ day, startTime: '', endTime: '', beginAddress: '', finalAddress: '' })));

    function updateSlot(index:number, patch: Partial<typeof slots[number]>) {
        setSlots(prev=>{
            const copy = [...prev];
            copy[index] = { ...copy[index], ...patch };
            return copy;
        });
    }

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent){
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            if (!(session as any)?.user?.id) {
                setMessage('You must be signed in to save a schedule');
                return;
            }

            // build availableTimes payload; use placeholder coords if no addresses provided
            const payloadTimes = slots.map(s => ({
                day: s.day,
                startTime: s.startTime,
                endTime: s.endTime,
                beginLocation: { lat: 0, long: 0 },
                finalLocation: { lat: 0, long: 0 }
            }));

            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availableTimes: payloadTimes })
            });
            const data = await res.json();
            if (!res.ok) {
                setMessage('Save failed: ' + (data?.error || 'unknown error'));
            } else {
                setMessage('Schedule saved');
            }
        } catch (err: any) {
            console.error(err);
            setMessage('Failed to save schedule: ' + (err.message || String(err)));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F5FF]">
            <Navbar isLoggedIn={isLoggedIn} />
            <main className="flex-grow p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Manual Schedule (one slot per weekday)</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {slots.map((slot, i)=> (
                        <div key={slot.day} className="p-4 border rounded-lg bg-white">
                            <h3 className="font-semibold mb-2">{slot.day}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div>
                                    <label className="block text-sm">Start Time</label>
                                    <input type="time" value={slot.startTime} onChange={(e)=>updateSlot(i,{ startTime: e.target.value })} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm">End Time</label>
                                    <input type="time" value={slot.endTime} onChange={(e)=>updateSlot(i,{ endTime: e.target.value })} className="w-full p-2 border rounded" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm">Begin Address</label>
                                    <input type="text" value={slot.beginAddress} onChange={(e)=>updateSlot(i,{ beginAddress: e.target.value })} className="w-full p-2 border rounded" placeholder="e.g. 123 Main St, City" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm">Final Address</label>
                                    <input type="text" value={slot.finalAddress} onChange={(e)=>updateSlot(i,{ finalAddress: e.target.value })} className="w-full p-2 border rounded" placeholder="e.g. 456 Park Ave, City" />
                                </div>
                            </div>
                        </div>
                    ))}

                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#663399] text-white rounded disabled:opacity-60">{saving ? 'Saving...' : 'Save Schedule'}</button>
                            <button type="button" onClick={()=>{ setSlots(weekdays.map(day=>({ day, startTime: '', endTime: '', beginAddress: '', finalAddress: '' })))}} className="px-4 py-2 border rounded">Clear</button>
                            {message && <div className="ml-4 text-sm">{message}</div>}
                        </div>
                </form>
            </main>
        </div>
    );
}
