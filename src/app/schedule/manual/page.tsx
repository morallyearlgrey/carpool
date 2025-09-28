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

function emptySlot(day: string): SlotType {
	return { day, startTime: '', endTime: '', beginAddress: '', finalAddress: '', beginLat: null, beginLng: null, finalLat: null, finalLng: null };
}

export default function ManualSchedulePage(){
	const { data: session, status } = useSession();
	const isLoggedIn = status === 'authenticated';

	// store multiple slots per weekday
	const [slotsByDay, setSlotsByDay] = useState<Record<DayName, SlotType[]>>(() => {
		const r: Record<DayName, SlotType[]> = {} as Record<DayName, SlotType[]>;
		weekdays.forEach(d => r[d] = []);
		return r;
	});

	const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
	const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
	// local inputs for the selected day
	const [localStart, setLocalStart] = useState<string>('');
	const [localDuration, setLocalDuration] = useState<number>(30); // minutes
	const [localBegin, setLocalBegin] = useState<{ lat?: number; lng?: number; description?: string } | null>(null);
	const [localFinal, setLocalFinal] = useState<{ lat?: number; lng?: number; description?: string } | null>(null);
	// Add states for displaying address values when editing
	const [beginAddressValue, setBeginAddressValue] = useState<string>('');
	const [finalAddressValue, setFinalAddressValue] = useState<string>('');

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
					// build slotsByDay from analyzed schedule
					const byDay: Record<DayName, SlotType[]> = weekdays.reduce((acc, d) => { acc[d] = []; return acc; }, {} as Record<DayName, SlotType[]> );
					for (const nt of parsedSchedule.availableTimes) {
						const dayName = (nt.day || '').toString();
						const matched = weekdays.find(w => w.toLowerCase() === dayName.toLowerCase());
						if (matched) {
							byDay[matched].push({ ...emptySlot(matched), startTime: nt.startTime || '', endTime: nt.endTime || '', beginAddress: '', finalAddress: '' });
						}
					}
					setSlotsByDay(byDay);
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

	// When session is ready, fetch saved schedule from server and populate slotsByDay
	useEffect(() => {
		if (!session || (status !== 'authenticated')) return;

		let cancelled = false;
		(async () => {
			try {
				const res = await fetch('/api/schedule');
				if (!res.ok) return;
				const data = await res.json();
				if (cancelled) return;
				const sched = data?.schedule;
				if (sched && Array.isArray(sched.availableTimes)) {
					const byDay: Record<DayName, SlotType[]> = weekdays.reduce((acc, d) => { acc[d] = []; return acc; }, {} as Record<DayName, SlotType[]> );
					for (const t of sched.availableTimes) {
						const dayName = (t.day || '').toString();
						const matched = weekdays.find(w => w.toLowerCase() === dayName.toLowerCase());
						if (matched) {
							byDay[matched].push({
								day: matched,
								startTime: t.startTime || '',
								endTime: t.endTime || '',
								beginAddress: (t.beginLocation && t.beginLocation.address) || '',
								finalAddress: (t.finalLocation && t.finalLocation.address) || '',
								beginLat: t.beginLocation && typeof t.beginLocation.lat === 'number' ? t.beginLocation.lat : null,
								beginLng: t.beginLocation && typeof t.beginLocation.long === 'number' ? t.beginLocation.long : null,
								finalLat: t.finalLocation && typeof t.finalLocation.lat === 'number' ? t.finalLocation.lat : null,
								finalLng: t.finalLocation && typeof t.finalLocation.long === 'number' ? t.finalLocation.long : null,
							});
						}
					}
					setSlotsByDay(byDay);
					setMessage('Loaded saved schedule');
				}
			} catch (err) {
				console.error('Failed to load saved schedule', err);
			}
		})();
		return () => { cancelled = true; };
	}, [session, status]);

	function addOrUpdateSlotForDay(dayIndex: number, slot: SlotType, editIndex: number | null = null) {
		const day = weekdays[dayIndex];
		setSlotsByDay(prev => {
			const copy = { ...prev } as Record<DayName, SlotType[]>;
			const arr = [...(copy[day] || [])];
			if (editIndex !== null && editIndex >= 0 && editIndex < arr.length) {
				arr[editIndex] = slot;
			} else {
				arr.push(slot);
			}
			copy[day] = arr;
			return copy;
		});
	}

	function removeSlotForDay(dayIndex: number, slotIndex: number) {
		const day = weekdays[dayIndex];
		setSlotsByDay(prev => {
			const copy = { ...prev } as Record<DayName, SlotType[]>;
			const arr = [...(copy[day] || [])];
			arr.splice(slotIndex, 1);
			copy[day] = arr;
			return copy;
		});
	}

	function applyLocalToSelectedDay(){
		if (selectedDayIndex === null) return;
		const start = localStart;
		const end = computeEndTime(localStart, localDuration);

		if (selectedDayIndex === null) return;
		const day = weekdays[selectedDayIndex];
		// check overlaps against existing slots for this day
		const daySlots = slotsByDay[day] || [];
		const overlaps: number[] = [];
		const newStart = timeToMinutes(start);
		const newEnd = timeToMinutes(end);
		daySlots.forEach((s, idx) => {
			const a = timeToMinutes(s.startTime);
			const b = timeToMinutes(s.endTime);
			if (Math.max(a, newStart) < Math.min(b, newEnd)) overlaps.push(idx);
		});

		if (overlaps.length > 0) {
			const conflictTexts = overlaps.map(i => `${daySlots[i].startTime}–${daySlots[i].endTime}`).join('\n');
			const proceed = confirm(`This slot conflicts with existing slots on ${day}:\n${conflictTexts}\n\nRemove the conflicting slots and save the new one?`);
			if (!proceed) { setMessage('Save cancelled due to conflict'); return; }
			// remove conflicting slots
			setSlotsByDay(prev => {
				const copy = { ...prev } as Record<DayName, SlotType[]>;
				copy[day] = (copy[day] || []).filter((_, i) => !overlaps.includes(i));
				return copy;
			});
		}

		const slot: SlotType = {
			day,
			startTime: start,
			endTime: end,
			beginAddress: localBegin?.description || '',
			finalAddress: localFinal?.description || '',
			beginLat: localBegin?.lat ?? null,
			beginLng: localBegin?.lng ?? null,
			finalLat: localFinal?.lat ?? null,
			finalLng: localFinal?.lng ?? null,
		};

		addOrUpdateSlotForDay(selectedDayIndex, slot, editingSlotIndex);
		setEditingSlotIndex(null);
		// Clear the form after saving
		setBeginAddressValue('');
		setFinalAddressValue('');
		setLocalBegin(null);
		setLocalFinal(null);
		setMessage(`Saved ${day} slot`);
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if (!(session as any)?.user?.id) {
				setMessage('You must be signed in to save a schedule');
				return;
			}

			// build availableTimes payload; include only filled slots (start+end present)
			// flatten all slots by day and filter filled
			const filled = Object.values(slotsByDay).flat().filter(s => s.startTime && s.endTime);
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
			<main className="flex-grow p-6 max-w-3xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">When are you on the road?</h1>

				<p className="mb-4 text-gray-600">Pick a day, set a from and to, and choose a short timeslot (default 30 minutes). Save each day as you go, then press Save Schedule when finished.</p>

				<div className="mb-4">
					<div className="flex gap-2 flex-wrap">
						{weekdays.map((d, idx) => (
							<button
								key={d}
								onClick={() => {
									setSelectedDayIndex(idx);
									const arr = slotsByDay[d] || [];
									const first = arr[0];
									setEditingSlotIndex(null);
									setLocalStart(first?.startTime || '17:00');
									setLocalDuration(first && first.endTime ? timeDiffMinutes(first.startTime, first.endTime) : 30);
									setLocalBegin(first?.beginLat ? { lat: first.beginLat, lng: first.beginLng ?? undefined, description: first.beginAddress } : null);
									setLocalFinal(first?.finalLat ? { lat: first.finalLat, lng: first.finalLng ?? undefined, description: first.finalAddress } : null);
									// Reset address input values
									setBeginAddressValue(first?.beginAddress || '');
									setFinalAddressValue(first?.finalAddress || '');
								}}
								className={`px-3 py-1 rounded ${selectedDayIndex===idx ? 'bg-purple-600 text-white' : 'bg-white border'}`}
							>
								{d.slice(0,3)} {slotsByDay[d]?.length ? `(${slotsByDay[d].length})` : ''}
							</button>
						))}
					</div>
				</div>

				<div className="bg-white p-4 rounded shadow">
					{ selectedDayIndex === null && (
						<div className="text-gray-600">Select a day above to begin.</div>
					)}

					{selectedDayIndex !== null && (
						<div>
							<h3 className="font-semibold mb-2">{weekdays[selectedDayIndex]}</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
								<div>
									<label className="block text-sm mb-1">From</label>
									<PlacesAutocomplete
										onAddressSelect={({ lat, lng, description }) => {
											setLocalBegin({ lat, lng, description });
											setBeginAddressValue(description);
										}}
										placeholder="Start address"
										value={beginAddressValue}
										onValueChange={setBeginAddressValue}
									/>
								</div>
								<div>
									<label className="block text-sm mb-1">To</label>
									<PlacesAutocomplete
										onAddressSelect={({ lat, lng, description }) => {
											setLocalFinal({ lat, lng, description });
											setFinalAddressValue(description);
										}}
										placeholder="End address"
										value={finalAddressValue}
										onValueChange={setFinalAddressValue}
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
								<div className="text-sm">Saved slots for {weekdays[selectedDayIndex]}:</div>
								<div className="p-2 border rounded bg-gray-50">
									{(slotsByDay[weekdays[selectedDayIndex]] || []).length === 0 && <em>No slots saved yet</em>}
									{(slotsByDay[weekdays[selectedDayIndex]] || []).map((ss, si) => (
										<div key={si} className="flex items-center justify-between py-1">
											<div className="text-sm">{ss.startTime} — {ss.endTime} <span className="text-xs text-gray-500">{ss.beginAddress || ''} → {ss.finalAddress || ''}</span></div>
											<div className="flex gap-2">
												<button onClick={() => {
													// load into editor for quick edit
													setEditingSlotIndex(si);
													setLocalStart(ss.startTime);
													setLocalDuration(Math.max(15, timeDiffMinutes(ss.startTime, ss.endTime)));
													setLocalBegin(ss.beginLat ? { lat: ss.beginLat, lng: ss.beginLng ?? undefined, description: ss.beginAddress } : null);
													setLocalFinal(ss.finalLat ? { lat: ss.finalLat, lng: ss.finalLng ?? undefined, description: ss.finalAddress } : null);
													// Populate address input values for editing
													setBeginAddressValue(ss.beginAddress || '');
													setFinalAddressValue(ss.finalAddress || '');
												}} className="text-xs text-blue-600 cursor-pointer">Edit</button>
												<button onClick={() => removeSlotForDay(selectedDayIndex, si)} className="text-xs text-red-600 cursor-pointer">Remove</button>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 mt-4">
					<button onClick={handleSubmit} className="px-4 py-2 bg-[#663399] text-white rounded disabled:opacity-60">{saving ? 'Saving...' : 'Save Schedule'}</button>
					<button onClick={()=>{ setSlotsByDay(weekdays.reduce((acc, d) => { acc[d as DayName] = []; return acc; }, {} as Record<DayName, SlotType[]>)); setMessage(null); }} className="px-4 py-2 border rounded">Clear All</button>
					{message && <div className="ml-4 text-sm">{message}</div>}
				</div>

				<section className="mt-6">
					<h2 className="font-semibold mb-2">Your schedule</h2>
					<div className="w-full overflow-auto border rounded bg-white p-3">
						{/* Header row */}
						<div className="grid grid-cols-8 border-b pb-2 mb-2">
							<div className="text-xs text-gray-500">Time</div>
							{weekdays.map(d => (
								<div key={d} className="text-xs text-center font-medium text-gray-700">{d}</div>
							))}
						</div>

						{/* Grid: we'll use absolute-positioned blocks inside a relative container */}
						<div className="relative w-full" style={{ minHeight: `${(timeToMinutes('22:00')-timeToMinutes('06:00'))/30 * 32}px` }}>
							{/* vertical time labels */}
							<div className="absolute left-0 top-0 w-16 text-xs text-gray-500">
								{generateTimes('06:00','22:00',30).map((t)=>(
									<div key={t} style={{ height: 32 }} className="flex items-center">{t}</div>
								))}
							</div>

							{/* weekdays columns */}
							<div className="ml-16 grid grid-cols-7 gap-0">
								{weekdays.map((d) => (
									<div key={d} className="relative border-l border-gray-100" style={{ minHeight: '100%' }}>
										{/* column background lines */}
										{generateTimes('06:00','22:00',30).map(t=> (
											<div key={d+t} style={{ height: 32 }} className="border-b border-gray-100"></div>
										))}

													{/* slot blocks for this day (support multiple) */}
													{(slotsByDay[d] || []).map((ss, si) => {
														if (!ss.startTime || !ss.endTime) return null;
														const topOffset = (timeToMinutes(ss.startTime) - timeToMinutes('06:00'))/30 * 32;
														const span = Math.max(1, Math.round((timeToMinutes(ss.endTime) - timeToMinutes(ss.startTime))/30));
														const height = span * 32 - 6;
														return (
															<div key={si} style={{ position: 'absolute', left: 6, right: 6, top: topOffset, height }} className="bg-purple-100 border border-purple-300 rounded p-2 flex items-center">
																<div className="text-xs font-medium">{ss.startTime} — {ss.endTime}</div>
															</div>
														)
													})}
									</div>
								))}
							</div>
						</div>
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