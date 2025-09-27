import { NextRequest, NextResponse } from "next/server";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";
import User from "@/lib/models/user";
import mongooseConnect from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;
    const { riderId, rideId, driverId, beginLocation, finalLocation, date, startTime, finalTime } = await req.json();
    if (!riderId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    // create a Request document representing the rider's request
    const newRequest = await RequestModel.create({
      user: riderId,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime
    });

    // If rideId provided, attach to ride.requestedRiders for driver review
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) return NextResponse.json({ error: 'ride not found' }, { status: 404 });

      ride.requestedRiders = ride.requestedRiders || [];
      ride.requestedRiders.push(riderId);
      await ride.save();

      // TODO: notify driver via push/email
      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // Otherwise, if a driverId is supplied (schedule-based candidate), attach request to user.requests
    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver) return NextResponse.json({ error: 'driver not found' }, { status: 404 });

      driver.requests = driver.requests || [];
      driver.requests.push(newRequest._id);
      await driver.save();

      // TODO: notify driver via push/email
      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If neither rideId nor driverId provided, return success but warn
    return NextResponse.json({ ok: true, requestId: newRequest._id, warning: 'no rideId or driverId attached; request stored standalone' });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
