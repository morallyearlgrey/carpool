import { NextRequest, NextResponse } from "next/server";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";

export async function POST(req: NextRequest) {
  try {
    const { riderId, rideId, beginLocation, finalLocation, date, startTime, finalTime } = await req.json();
    if (!riderId || !rideId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
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

    // add to the Ride.requestedRiders for driver's review
    const ride = await Ride.findById(rideId);
    if (!ride) return NextResponse.json({ error: 'ride not found' }, { status: 404 });

    ride.requestedRiders = ride.requestedRiders || [];
    ride.requestedRiders.push(riderId);
    await ride.save();

    // TODO: send real notification (email/push). For now, return success and newRequest id
    return NextResponse.json({ ok: true, requestId: newRequest._id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
