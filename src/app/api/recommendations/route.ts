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

// convert "HH:MM" to minutes since midnight
const toMinutes = (t: string) => {
  const [hh, mm] = (t || '00:00').split(':').map(Number);
  return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
};

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect();
    const body = await req.json();

    const { userId, date, startTime, beginLocation, finalLocation, mode } = body;

    if (!userId || !date || !startTime || !beginLocation || !finalLocation || !mode) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    if (mode !== 'rides' && mode !== 'schedules') {
      return NextResponse.json({ error: "invalid mode; must be 'rides' or 'schedules'" }, { status: 400 });
    }

    const queryDate = new Date(date);
    if (Number.isNaN(queryDate.getTime())) {
      return NextResponse.json({ error: 'invalid date' }, { status: 400 });
    }

    const candidates: any[] = [];

    // load requesting user to ensure they have a schedule when using schedules mode
    const requestingUser = await User.findById(userId).lean();
    if (!requestingUser) {
      return NextResponse.json({ error: 'requesting user not found' }, { status: 404 });
    }

    // If mode === 'schedules', ensure the requesting user has a schedule with availabilities
    if (mode === 'schedules') {
      const userScheduleId = requestingUser.schedule;
      if (!userScheduleId) {
        return NextResponse.json({ error: 'no schedule found for requesting user; please upload a schedule before requesting recommendations' }, { status: 400 });
      }
      const userSchedule = await Schedule.findById(userScheduleId).lean();
      if (!userSchedule || !userSchedule.availableTimes?.length) {
        return NextResponse.json({ error: 'your schedule has no availability slots; please add availability times before requesting schedule-based recommendations', uiMessage: 'Please submit a schedule to enable this feature.' }, { status: 400 });
      }
    }

    // If mode includes rides, find active rides on that date
    const rides = (mode === 'rides') ? await Ride.find({ date: { $eq: queryDate } }).populate('driver').lean() : [];

    for (const rideRaw of rides as any[]) {
      const ride = rideRaw as any;
      if (!ride.beginLocation || !ride.finalLocation) continue;

      const distStart = haversineDistance(beginLocation.lat, beginLocation.long, ride.beginLocation.lat, ride.beginLocation.long);
      const distEnd = haversineDistance(finalLocation.lat, finalLocation.long, ride.finalLocation.lat, ride.finalLocation.long);

  const timeDiff = Math.abs(toMinutes(startTime) - toMinutes(ride.startTime || startTime));

  // prefer driver's declared vehicle seats when available, else fall back to ride.maxRiders
  const driverSeats = (ride.driver as any)?.vehicleInfo?.seatsAvailable ?? null;
  const maxSeats = driverSeats != null ? driverSeats : (ride.maxRiders ?? 0);
  const seatsLeft = maxSeats - ((ride.riders?.length) ?? 0);

      // normalize factors to 0..1-ish and weight them
      const startScore = 1 / (1 + distStart); // closer -> higher
      const endScore = 1 / (1 + distEnd);
      const timeScore = 1 / (1 + timeDiff);
      const seatsScore = seatsLeft > 0 ? Math.min(1, seatsLeft / 4) : 0;

      const score = startScore * 0.5 + endScore * 0.2 + timeScore * 0.2 + seatsScore * 0.1;

      candidates.push({
        id: String(ride._id),
        type: 'ride',
        driver: ride.driver,
        beginLocation: ride.beginLocation,
        finalLocation: ride.finalLocation,
        startTime: ride.startTime,
        timeDiff,
        seatsLeft,
        score,
      });
    }

    // If mode includes schedules, iterate schedules and their availableTimes for the weekday
    if (mode === 'schedules') {
      const schedules = await Schedule.find({}).lean();
      const weekday = queryDate.toLocaleDateString('en-US', { weekday: 'long' });

      for (const sched of schedules as any[]) {
        if (!sched.availableTimes?.length) continue;

        for (const slot of sched.availableTimes as any[]) {
          if (slot.day !== weekday) continue;

          // compute if rider startTime falls within slot +/- slack minutes
          const slack = 60; // minutes
          const riderMin = toMinutes(startTime);
          const slotStart = toMinutes(slot.startTime);
          const slotEnd = toMinutes(slot.endTime);
          if (riderMin < slotStart - slack || riderMin > slotEnd + slack) continue;

          // load user for this schedule and populate currentRide if present to avoid a second query
          const user = (await User.findById(sched.user).populate('currentRide').lean()) as any;
          if (!user) continue;

          // estimate driver's begin/final locations: prefer slot, else currentRide
          let estBegin = slot.beginLocation ?? null;
          let estFinal = slot.finalLocation ?? null;
          let seatsLeft = user?.vehicleInfo?.seatsAvailable ?? null;

          if ((!estBegin || !estFinal) && user.currentRide) {
            const r: any = (typeof user.currentRide === 'object') ? user.currentRide : await Ride.findById(user.currentRide).lean();
            if (r) {
              if (!estBegin && r.beginLocation) estBegin = r.beginLocation;
              if (!estFinal && r.finalLocation) estFinal = r.finalLocation;
              // if currentRide exists, prefer its seats for availability
              seatsLeft = (r.maxRiders ?? 0) - ((r.riders?.length) ?? 0);
            }
          }

          if (!estBegin) continue; // need at least a start location to match

          // compute distances
          const distStart = haversineDistance(beginLocation.lat, beginLocation.long, estBegin.lat, estBegin.long);
          const distEnd = estFinal ? haversineDistance(finalLocation.lat, finalLocation.long, estFinal.lat, estFinal.long) : 1000;

          // time overlap score: how close rider time is to slot start
          const timeProx = 1 / (1 + Math.abs(riderMin - slotStart));

          const distScore = 1 / (1 + distStart);
          const seatsScore = seatsLeft != null ? Math.min(1, seatsLeft / 4) : 0.2;

          const score = distScore * 0.6 + timeProx * 0.3 + seatsScore * 0.1;

          candidates.push({
            id: `${sched._id}-${slot.startTime}`,
            type: 'driver_schedule',
            driver: user,
            beginLocation: estBegin,
            finalLocation: estFinal,
            startTime: slot.startTime,
            endTime: slot.endTime,
            seatsLeft,
            distStart,
            distEnd,
            score,
          });
        }
      }
    }

    // sort and return top results
    candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return NextResponse.json({ candidates: candidates.slice(0, 10) });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
