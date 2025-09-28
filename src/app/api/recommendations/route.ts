import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/user";
import Schedule from "@/lib/models/schedule";
import Ride from "@/lib/models/ride";
import mongooseConnect from '@/lib/mongoose';

// Simple Haversine distance in kilometers
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;
    const body = await req.json();

    const { userId, date, startTime, beginLocation, finalLocation, mode } = body;

    if (!userId || !date || !startTime || !beginLocation || !finalLocation || !mode) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    if (mode !== 'rides' && mode !== 'schedules') {
      return NextResponse.json({ error: "invalid mode; must be 'rides' or 'schedules'" }, { status: 400 });
    }

    // Parse date to start-of-day to match schedules/rides
    const queryDate = new Date(date);


  // Find all rides for the given date (drivers offering rides) — only if mode includes rides
    const rides = (mode === 'rides') ? await Ride.find({ date: { $eq: queryDate } }).populate('driver').lean() : [];

  // Also consider users with schedules on that day — only if mode === 'schedules'
  const schedules = (mode === 'schedules') ? await Schedule.find({}).populate('user').lean() : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidates: any[] = [];

    // Score rides by time proximity and geographic closeness
    const toMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const ride of rides as any[]) {
      // compute distance from rider beginLocation to ride beginLocation
      if (!ride.beginLocation) continue;
      const distStart = haversineDistance(beginLocation.lat, beginLocation.long, ride.beginLocation.lat, ride.beginLocation.long);
      const distEnd = haversineDistance(finalLocation.lat, finalLocation.long, ride.finalLocation?.lat ?? ride.beginLocation.lat, ride.finalLocation?.long ?? ride.beginLocation.long);

      // time proximity: compare startTime strings "HH:MM"
      const timeDiff = Math.abs(toMinutes(startTime) - toMinutes(ride.startTime || startTime));

      // seats available heuristic
      const seatsLeft = (ride.maxRiders ?? 0) - ((ride.riders?.length) ?? 0);

      const score = (1 / (1 + distStart)) * 0.6 + (1 / (1 + distEnd)) * 0.2 + (1 / (1 + timeDiff)) * 0.2 + (seatsLeft > 0 ? 0.1 : -1);

      candidates.push({
        type: 'ride',
        rideId: ride._id,
        driver: ride.driver,
        ride,
        distStart,
        distEnd,
        timeDiff,
        seatsLeft,
        score
      });
    }

    // schedule-based candidates: iterate each availableTime for weekday
    const weekday = queryDate.toLocaleDateString('en-US', { weekday: 'long' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const sched of schedules as any[]) {
      if (!sched.availableTimes) continue;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const slot of sched.availableTimes as any[]) {
        if (slot.day !== weekday) continue;

        // compute time overlap and allow 1 hour slack
        const start = toMinutes(startTime);
        const availStart = toMinutes(slot.startTime);
        const availEnd = toMinutes(slot.endTime);
        const slack = 60; // minutes
        if (start < availStart - slack || start > availEnd + slack) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user: any = await User.findById(sched.user).lean();
        if (!user) continue;

        // estimate driver's route endpoints: prefer slot's begin/final locations, else fallback to currentRide
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let estBegin: any = slot.beginLocation ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let estEnd: any = slot.finalLocation ?? null;
        let seatsLeft = user?.vehicleInfo?.seatsAvailable ?? null;
        if ((!estBegin || !estEnd) && user.currentRide) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r: any = await Ride.findById(user.currentRide).lean();
          if (r) {
            if (!estBegin && r.beginLocation) estBegin = r.beginLocation;
            if (!estEnd && r.finalLocation) estEnd = r.finalLocation;
            seatsLeft = (r.maxRiders ?? 0) - ((r.riders?.length) ?? 0);
          }
        }

        // compute distance from rider start to estimated driver start
        let distStart = 1000;
        if (estBegin) {
          distStart = haversineDistance(beginLocation.lat, beginLocation.long, estBegin.lat, estBegin.long);
        }

        // estimate end-time: use slot.endTime if available
        const estEndTime = slot.endTime || slot.startTime;

        // score favors geographic closeness and earlier overlap
        const timeProx = 1 / (1 + Math.abs(start - availStart));
        const distScore = 1 / (1 + distStart);
        const seatsScore = seatsLeft != null ? Math.min(1, seatsLeft / 4) : 0.2;

        const score = distScore * 0.6 + timeProx * 0.3 + seatsScore * 0.1;

        candidates.push({
          id: sched._id + '-' + slot.startTime,
          type: 'driver_schedule',
          driver: user,
          startTime: slot.startTime,
          endTime: estEndTime,
          beginLocation: estBegin,
          finalLocation: estEnd,
          seatsLeft,
          distStart,
          score
        });
      }
    }

    // sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // return top 10
    return NextResponse.json({ candidates: candidates.slice(0, 10) });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
