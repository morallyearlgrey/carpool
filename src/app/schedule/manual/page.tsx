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
	beginLat?: number | null;
	beginLng?: number | null;
	finalLat?: number | null;
	finalLng?: number | null;
};

export default function ManualSchedulePage(){
	const { data: session, status } = useSession();
	const isLoggedIn = status === 'authenticated';

	const [slots, setSlots] = useState<SlotType[]>(
		weekdays.map(day=>({ day, startTime: '', endTime: '', beginAddress: '', finalAddress: '', beginLat: null, beginLng: null, finalLat: null, finalLng: null }))
	);

	const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
	// local inputs for the selected day
	const [localStart, setLocalStart] = useState<string>('');
	const [localDuration, setLocalDuration] = useState<number>(30); // minutes
	const [localBegin, setLocalBegin] = useState<{ lat?: number; lng?: number; description?: string } | null>(null);
	const [localFinal, setLocalFinal] = useState<{ lat?: number; lng?: number; description?: string } | null>(null);

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
                    
					setSlots(newSlots.map((s: any) => ({ ...s, beginLat: null, beginLng: null, finalLat: null, finalLng: null })));
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

	function applyLocalToSelectedDay(){
		if (selectedDayIndex === null) return;
		const start = localStart;
		const end = computeEndTime(localStart, localDuration);
		// detect conflicts with other slots on the same day
		const conflicts: number[] = [];
		slots.forEach((s, idx) => {
			if (idx === selectedDayIndex) return;
			if (s.day !== slots[selectedDayIndex].day) return;
			if (!s.startTime || !s.endTime) return;
			// overlap check
			const a1 = timeToMinutes(s.startTime);
			const a2 = timeToMinutes(s.endTime);
			const b1 = timeToMinutes(start);
			const b2 = timeToMinutes(end);
			if (Math.max(a1, b1) < Math.min(a2, b2)) {
				conflicts.push(idx);
			}
		});

		if (conflicts.length > 0) {
			const conflictTexts = conflicts.map(i => `${slots[i].day}: ${slots[i].startTime}–${slots[i].endTime}`).join('\n');
			const proceed = confirm(`This slot conflicts with existing slots:\n${conflictTexts}\n\nRemove the conflicting slots and save the new one?`);
			if (proceed) {
				// remove conflicts first
				const newSlots = slots.map((s, idx) => conflicts.includes(idx) ? { ...s, startTime: '', endTime: '', beginAddress: '', finalAddress: '', beginLat: null, beginLng: null, finalLat: null, finalLng: null } : s);
				setSlots(newSlots);
			} else {
				setMessage('Save cancelled due to conflict');
				return;
			}
		}

		updateSlot(selectedDayIndex, {
			startTime: start,
			endTime: end,
			beginAddress: localBegin?.description || '',
			finalAddress: localFinal?.description || '',
			beginLat: localBegin?.lat ?? null,
			beginLng: localBegin?.lng ?? null,
			finalLat: localFinal?.lat ?? null,
			finalLng: localFinal?.lng ?? null,
		});
		setMessage(`Saved ${weekdays[selectedDayIndex]} slot`);
	}

	function computeEndTime(start: string, durationMinutes: number){
		if (!start) return '';
		const [hh, mm] = start.split(':').map(Number);
		const dt = new Date();
		dt.setHours(hh, mm + durationMinutes, 0, 0);
		const hh2 = dt.getHours().toString().padStart(2,'0');
		const mm2 = dt.getMinutes().toString().padStart(2,'0');
		return `${hh2}:${mm2}`;
	}

	async function handleSubmit(e: React.FormEvent){
		e.preventDefault();
		setSaving(true);
		setMessage(null);
		try {
			if (!(session as any)?.user?.id) {
				setMessage('You must be signed in to save a schedule');
				return;
			}

			// build availableTimes payload; include only filled slots (start+end present)
			const filled = slots.filter(s => s.startTime && s.endTime);
			if (filled.length === 0) {
				setMessage('No slots to save. Please add at least one day slot before saving.');
				setSaving(false);
				return;
			}

			const payloadTimes = filled.map(s => ({
				day: s.day,
				startTime: s.startTime,
				endTime: s.endTime,
				beginLocation: { lat: typeof s.beginLat === 'number' ? s.beginLat : 0, long: typeof s.beginLng === 'number' ? s.beginLng : 0 },
				finalLocation: { lat: typeof s.finalLat === 'number' ? s.finalLat : 0, long: typeof s.finalLng === 'number' ? s.finalLng : 0 }
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
			<main className="flex-grow p-6 max-w-3xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">When are you on the road?</h1>

				<p className="mb-4 text-gray-600">Pick a day, set a from and to, and choose a short timeslot (default 30 minutes). Save each day as you go, then press Save Schedule when finished.</p>

				<div className="mb-4">
					<div className="flex gap-2 flex-wrap">
						{slots.map((s, idx) => (
							<button
								key={s.day}
								onClick={() => {
									setSelectedDayIndex(idx);
									// load local values
									setLocalStart(s.startTime || '17:00');
									setLocalDuration(s.startTime && s.endTime ? timeDiffMinutes(s.startTime, s.endTime) : 30);
									setLocalBegin(s.beginLat ? { lat: s.beginLat, lng: s.beginLng ?? undefined, description: s.beginAddress } : null);
									setLocalFinal(s.finalLat ? { lat: s.finalLat, lng: s.finalLng ?? undefined, description: s.finalAddress } : null);
								}}
								className={`px-3 py-1 rounded ${selectedDayIndex===idx ? 'bg-purple-600 text-white' : 'bg-white border'}`}
							>
								{s.day.slice(0,3)}
							</button>
						))}
					</div>
				</div>

				<div className="bg-white p-4 rounded shadow">
					{!Number.isFinite(selectedDayIndex) && selectedDayIndex === null && (
						<div className="text-gray-600">Select a day above to begin.</div>
					)}

					{selectedDayIndex !== null && (
						<div>
							<h3 className="font-semibold mb-2">{weekdays[selectedDayIndex]}</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
								<div>
									<label className="block text-sm mb-1">From</label>
									<PlacesAutocomplete
										onAddressSelect={({ lat, lng, description }) => setLocalBegin({ lat, lng, description })}
										placeholder="Start address"
									/>
								</div>
								<div>
									<label className="block text-sm mb-1">To</label>
									<PlacesAutocomplete
										onAddressSelect={({ lat, lng, description }) => setLocalFinal({ lat, lng, description })}
										placeholder="End address"
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 mb-3">
								<div>
									<label className="block text-sm">Start time</label>
									<input type="time" value={localStart} onChange={(e)=>setLocalStart(e.target.value)} className="p-2 border rounded" />
								</div>

								<div>
									<label className="block text-sm">Duration</label>
									<select value={localDuration} onChange={(e)=>setLocalDuration(Number(e.target.value))} className="p-2 border rounded">
										<option value={15}>15 min</option>
										<option value={30}>30 min</option>
										<option value={45}>45 min</option>
										<option value={60}>60 min</option>
									</select>
								</div>

								<div className="ml-auto">
									<button onClick={applyLocalToSelectedDay} className="px-3 py-2 bg-purple-600 text-white rounded">Save Day</button>
								</div>
							</div>

							<div className="text-sm text-gray-600 mb-2">Preview: {localStart} — {computeEndTime(localStart, localDuration)}</div>

							<div className="space-y-2">
								<div className="text-sm">Saved slot:</div>
								<div className="p-2 border rounded bg-gray-50">
									<div className="text-sm">{slots[selectedDayIndex].startTime ? `${slots[selectedDayIndex].startTime} — ${slots[selectedDayIndex].endTime}` : <em>No slot saved yet</em>}</div>
									<div className="text-xs text-gray-500">{slots[selectedDayIndex].beginAddress || 'No start address'} → {slots[selectedDayIndex].finalAddress || 'No end address'}</div>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 mt-4">
					<button onClick={handleSubmit as any} className="px-4 py-2 bg-[#663399] text-white rounded disabled:opacity-60">{saving ? 'Saving...' : 'Save Schedule'}</button>
					<button onClick={()=>{ setSlots(weekdays.map(day=>({ day, startTime: '', endTime: '', beginAddress: '', finalAddress: '', beginLat: null, beginLng: null, finalLat: null, finalLng: null }))); setMessage(null); }} className="px-4 py-2 border rounded">Clear All</button>
					{message && <div className="ml-4 text-sm">{message}</div>}
				</div>

				<section className="mt-6">
					<h2 className="font-semibold mb-2">Your schedule (compact view)</h2>
					<div className="w-full overflow-auto border rounded bg-white p-3">
						<div className="grid grid-cols-8 gap-1 items-center">
							<div className="text-xs text-gray-500">Time</div>
							{weekdays.map(d => (
								<div key={d} className="text-xs text-center text-gray-700">{d.slice(0,3)}</div>
							))}
						</div>

						{/* times 6:00-22:00 in 30min steps */}
						{generateTimes('06:00','22:00',30).map(t => (
							<div key={t} className="grid grid-cols-8 gap-1 items-center text-sm mt-1">
								<div className="text-xs text-gray-500">{t}</div>
								{slots.map((s, idx) => (
									<div key={s.day} className="h-8">
										{s.startTime && s.endTime && timeToMinutes(t) >= timeToMinutes(s.startTime) && timeToMinutes(t) < timeToMinutes(s.endTime) ? (
											<div className="h-8 bg-purple-200 rounded flex items-center justify-center">
												<button className="text-xs" onClick={() => {
													if (!confirm(`Remove slot on ${s.day} ${s.startTime}-${s.endTime}?`)) return;
													// remove slot
													updateSlot(idx, { startTime: '', endTime: '', beginAddress: '', finalAddress: '', beginLat: null, beginLng: null, finalLat: null, finalLng: null });
												}}>{s.startTime}</button>
											</div>
										) : (
											<div className="h-8"></div>
										)}
									</div>
								))}
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

function timeToMinutes(t: string){
	const [h, m] = t.split(':').map(Number);
	return h*60 + m;
}

function generateTimes(start: string, end: string, stepMins: number){
	const out: string[] = [];
	let cur = timeToMinutes(start);
	const e = timeToMinutes(end);
	while (cur < e) {
		const hh = Math.floor(cur/60).toString().padStart(2,'0');
		const mm = (cur%60).toString().padStart(2,'0');
		out.push(`${hh}:${mm}`);
		cur += stepMins;
	}
	return out;
}

function timeDiffMinutes(a: string, b: string){
	if (!a || !b) return 0;
	const [ah, am] = a.split(':').map(Number);
	const [bh, bm] = b.split(':').map(Number);
	return (bh*60+bm) - (ah*60+am);
}