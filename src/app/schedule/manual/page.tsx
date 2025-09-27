"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
// For address autocompletion
import PlacesAutocomplete from '@/components/PlacesAutocomplete';

type DayName = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday';

const weekdays: DayName[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

type SlotType = {
    day: string;
    startTime: string;
    endTime: string;
    beginAddress: string;
    finalAddress: string;
};

export default function ManualSchedulePage(){
	const { data: session, status } = useSession();
	const isLoggedIn = status === 'authenticated';

    const [slots, setSlots] = useState<SlotType[]>(
        weekdays.map(day=>({ day, startTime: '', endTime: '', beginAddress: '', finalAddress: '' }))
    );

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Load analyzed schedule data on component mount
    useEffect(() => {
        // Only run this on the client side
        if (typeof window === 'undefined') return;
        
        const analyzedScheduleData = sessionStorage.getItem('analyzedSchedule');
        if (analyzedScheduleData) {
            try {
                const parsedSchedule = JSON.parse(analyzedScheduleData);
                if (parsedSchedule.availableTimes && Array.isArray(parsedSchedule.availableTimes)) {
                    // Convert the analyzed schedule to the format expected by the form
                    const newSlots = weekdays.map(day => {
                        // Find matching day in analyzed schedule
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const matchingTime = parsedSchedule.availableTimes.find((time: any) => 
                            time.day.toLowerCase() === day.toLowerCase()
                        );
                        
                        if (matchingTime) {
                            return {
                                day,
                                startTime: matchingTime.startTime || '',
                                endTime: matchingTime.endTime || '',
                                beginAddress: '', // Addresses aren't provided by Gemini, leave empty for user to fill
                                finalAddress: ''
                            };
                        }
                        
                        // If no matching day found, return empty slot
                        return { day, startTime: '', endTime: '', beginAddress: '', finalAddress: '' };
                    });
                    
                    setSlots(newSlots);
                    setMessage('Schedule loaded from image analysis! Please add addresses as needed.');
                    
                    // Clear the session storage after loading
                    sessionStorage.removeItem('analyzedSchedule');
                } else {
                    // Invalid or empty analyzed schedule data
                    sessionStorage.removeItem('analyzedSchedule');
                }
            } catch (error) {
                console.error('Error parsing analyzed schedule:', error);
                setMessage('Error loading analyzed schedule data. Starting with empty form.');
                // Clear corrupted data
                sessionStorage.removeItem('analyzedSchedule');
            }
        }
        // If no analyzed schedule data, form starts empty (default behavior)
    }, []);

    function updateSlot(index:number, patch: Partial<SlotType>) {
        setSlots(prev=>{
            const copy = [...prev];
            copy[index] = { ...copy[index], ...patch };
            return copy;
        });
    }

	async function handleSubmit(e: React.FormEvent){
		e.preventDefault();
		setSaving(true);
		setMessage(null);
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		} catch (err: unknown) {
			console.error(err);
			setMessage('Failed to save schedule: ' + (err instanceof Error ? err.message : String(err)));
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
									<label className="block text-sm">Start Address</label>
									<PlacesAutocomplete
											onAddressSelect={({ description }) => {
													updateSlot(i, { beginAddress: description });
											}}
											placeholder="e.g. 123 Main St, City"
									/>
								</div>
								<div className="md:col-span-2">
									<label className="block text-sm">Final Address</label>
									<PlacesAutocomplete
											onAddressSelect={({ description }) => {
													updateSlot(i, { beginAddress: description });
											}}
											placeholder="e.g. 456 Third Dr, City"
									/>
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