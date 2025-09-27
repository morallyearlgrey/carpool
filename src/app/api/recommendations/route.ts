import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/user";
import Schedule from "@/lib/models/schedule";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";

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
    const body = await req.json();

    const { userId, date, startTime, beginLocation, finalLocation } = body;

    if (!userId || !date || !startTime || !beginLocation || !finalLocation) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    // Parse date to start-of-day to match schedules/rides
    const queryDate = new Date(date);

    // Find all rides for the given date (drivers offering rides)
    const rides = await Ride.find({ date: { $eq: queryDate } }).populate('driver').lean();

    // Also consider users with schedules on that day
    const schedules = await Schedule.find({}).populate('user').lean();

    const candidates: any[] = [];

    // Score rides by time proximity and geographic closeness
    const toMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };

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

    // simple schedule-based candidates: users who are available on that weekday and time
    const weekday = queryDate.toLocaleDateString('en-US', { weekday: 'long' });
  for (const sched of schedules as any[]) {
      if (!sched.availableTimes) continue;
      const matching = sched.availableTimes.find((a: any) => a.day === weekday);
      if (!matching) continue;

      // check time overlap
      const start = toMinutes(startTime);
      const availStart = toMinutes(matching.startTime);
      const availEnd = toMinutes(matching.endTime);
      if (start < availStart - 60 || start > availEnd + 60) continue; // allow 1-hour slack

      // try to approximate route by looking at user's current rides if any
  const user: any = await User.findById(sched.user).lean();
      if (!user) continue;

      // placeholder distances: attempt to use user's currentRide or last ride
      let distStart = 1000;
      if (user.currentRide) {
        const r: any = await Ride.findById(user.currentRide).lean();
        if (r?.beginLocation) {
          distStart = haversineDistance(beginLocation.lat, beginLocation.long, r.beginLocation.lat, r.beginLocation.long);
        }
      }

      const score = (1 / (1 + distStart)) * 0.7 + (1 / (1 + Math.abs(start - toMinutes(matching.startTime)))) * 0.3;

      candidates.push({
        type: 'driver_schedule',
        driver: user,
        schedule: sched,
        distStart,
        score
      });
    }

    // sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // return top 10
    return NextResponse.json({ candidates: candidates.slice(0, 10) });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
