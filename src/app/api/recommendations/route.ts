import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/user';
import Schedule from '@/lib/models/schedule';
import Ride from '@/lib/models/ride';

function toMinutes(t?: string) {
  if (!t) return 0;
  const [hh, mm] = t.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, date, explain = false } = body || {};
    if (!userId || !date) return NextResponse.json({ error: 'userId and date are required' }, { status: 400 });

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return NextResponse.json({ error: 'invalid date' }, { status: 400 });

    // load requester and their schedule
    const requester = await User.findById(userId).lean() as any;
    if (!requester) return NextResponse.json({ error: 'requesting user not found' }, { status: 404 });

    let requesterSchedule = null as any;
    if (requester.schedule) requesterSchedule = await Schedule.findById(requester.schedule).lean() as any;
    if (!requesterSchedule) requesterSchedule = await Schedule.findOne({ user: requester._id }).lean() as any;
    if (!requesterSchedule) return NextResponse.json({ error: 'requesting user has no schedule; upload one to use recommendations', uiMessage: 'Please submit a schedule to enable this feature.' }, { status: 400 });

    const day = parsed.toLocaleDateString('en-US', { weekday: 'long' });
    const dayFull = (day || '').toLowerCase();
    const dayKey = dayFull.slice(0, 3);

    const slots = (requesterSchedule.availableTimes || []).filter((s: any) => {
      const sd = ((s.day || '') + '').toString().toLowerCase().trim();
      return sd.slice(0,3) === dayKey || sd === dayFull || sd.includes(dayFull) || sd.includes('weekday');
    });
    if (!slots.length) return NextResponse.json({ candidates: [], diagnostics: [{ reason: 'requester_no_slots_for_day', day: dayFull }] });

    // find rides scheduled for that date (ride.date is a Date in the model)
    const dateString = parsed.toISOString().slice(0,10);
    const rides = await Ride.find({ date: { $gte: new Date(dateString + 'T00:00:00Z'), $lt: new Date(dateString + 'T23:59:59Z') } }).populate('driver').lean() as any[];

    const MAX_DIST_KM = Number(process.env.NEXT_PUBLIC_RECOMMENDATION_MAX_DIST_KM ?? '25');
    const TIME_SLACK = Number(process.env.NEXT_PUBLIC_RECOMMENDATION_TIME_SLACK_MINUTES ?? '90');

    const diagnostics: any[] = [];
    const candidatesMap = new Map<string, any>();

    for (const slot of slots) {
      const slotStart = toMinutes(slot.startTime);
      const slotBegin = slot.beginLocation;
      const slotFinal = slot.finalLocation;
      if (!slotBegin) {
        if (explain) diagnostics.push({ reason: 'slot_missing_begin', slot });
        continue;
      }

      for (const r of rides) {
        const rideStart = toMinutes(r.startTime);
        const timeDelta = Math.max(0, Math.abs(rideStart - slotStart));
        const timeScore = Math.max(0, (TIME_SLACK - timeDelta) / TIME_SLACK);

        const startDist = (r.beginLocation && slotBegin) ? haversineDistance(slotBegin.lat, slotBegin.long, r.beginLocation.lat, r.beginLocation.long) : 1000;
        const endDist = (r.finalLocation && slotFinal) ? haversineDistance(slotFinal.lat, slotFinal.long, r.finalLocation.lat, r.finalLocation.long) : 1000;
        const startScore = Math.max(0, (MAX_DIST_KM - startDist) / MAX_DIST_KM);
        const endScore = Math.max(0, (MAX_DIST_KM - endDist) / MAX_DIST_KM);

        const seatsLeft = r.maxRiders ? Math.max(0, (r.maxRiders - ((r.riders?.length) || 0))) : (r.driver?.vehicleInfo?.seatsAvailable ?? 0);
        const seatsScore = seatsLeft > 0 ? 1 : 0;

        const score = timeScore * 0.5 + startScore * 0.35 + endScore * 0.1 + seatsScore * 0.05;

        if (explain) diagnostics.push({ rideId: r._id, timeDelta, startDist, endDist, seatsLeft, score });

        // keep the best score per ride (multiple slots may match same ride)
        const prev = candidatesMap.get(String(r._id));
        if (!prev || (score > prev.score)) {
          candidatesMap.set(String(r._id), { id: String(r._id), type: 'ride', ride: r, score, timeDelta, startDist, endDist, seatsLeft });
        }
      }
    }

    const candidates = Array.from(candidatesMap.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const maxResults = Number(process.env.NEXT_PUBLIC_RECOMMENDATION_MAX_RESULTS ?? '10');
    const response: any = { candidates: candidates.slice(0, maxResults) };
    if (explain) response.diagnostics = diagnostics;
    if (!response.candidates.length && !explain) response.uiMessage = 'No rides matched your schedule; try widening time or checking your schedule.';
    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}