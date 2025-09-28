import { NextRequest, NextResponse } from "next/server";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";
import User from "@/lib/models/user";
import mongooseConnect from "@/lib/mongoose";

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect();
    const { riderId, rideId, driverId, beginLocation, finalLocation, date, startTime, finalTime } = await req.json();

    if (!riderId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    // create a Request document
    const newRequest = await RequestModel.create({
      requestSender: riderId,
      requestReceiver: null,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

  // Attach to rider's outgoingRequests using atomic update to avoid loading full user doc
  const riderUpdate = await User.findByIdAndUpdate(riderId, { $push: { outgoingRequests: newRequest._id } });
  if (!riderUpdate) return NextResponse.json({ error: "rider not found" }, { status: 404 });

    // If rideId provided, attach to ride.requestedRiders
    if (rideId) {
      const rideUpdate = await Ride.findByIdAndUpdate(rideId, { $push: { requestedRiders: riderId } });
      if (!rideUpdate) return NextResponse.json({ error: "ride not found" }, { status: 404 });
      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If driverId provided, attach request to driver.incomingRequests
    if (driverId) {
      const driverUpdate = await User.findByIdAndUpdate(driverId, { $push: { incomingRequests: newRequest._id } });
      if (!driverUpdate) return NextResponse.json({ error: "driver not found" }, { status: 404 });
      newRequest.requestReceiver = driverId;
      await newRequest.save();
      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }


    // If neither rideId nor driverId provided, return success but warn
    return NextResponse.json({ ok: true, requestId: newRequest._id, warning: 'no rideId or driverId attached; request stored standalone' });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
