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

    // Attach to rider's outgoingRequests
    const rider = await User.findById(riderId);
    if (!rider) return NextResponse.json({ error: "rider not found" }, { status: 404 });

    rider.outgoingRequests = rider.outgoingRequests || [];
    rider.outgoingRequests.push(newRequest._id);
    await rider.save();

    // If rideId provided, attach to ride.requestedRiders
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) return NextResponse.json({ error: "ride not found" }, { status: 404 });

      ride.requestedRiders = ride.requestedRiders || [];
      ride.requestedRiders.push(riderId);
      await ride.save();

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If driverId provided, attach request to driver.incomingRequests
    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });

      driver.incomingRequests = driver.incomingRequests || [];
      newRequest.requestReceiver = driverId;
      driver.incomingRequests.push(newRequest._id);
      await Promise.all([driver.save(), newRequest.save()]);

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If neither rideId nor driverId provided
    return NextResponse.json({
      ok: true,
      requestId: newRequest._id,
      warning: "no rideId or driverId attached; request stored standalone",
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
