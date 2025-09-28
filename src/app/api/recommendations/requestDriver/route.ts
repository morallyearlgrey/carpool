import { NextRequest, NextResponse } from "next/server";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";
import User from "@/lib/models/user";
import mongooseConnect from "@/lib/mongoose";
import admin from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;
    const { riderId, rideId, driverId, beginLocation, finalLocation, date, startTime, finalTime } = await req.json();

    if (!riderId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    const newRequest = await RequestModel.create({
      requestSender: riderId,
      requestReceiver: null,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

    const rider = await User.findById(riderId);
    if (!rider) return NextResponse.json({ error: "rider not found" }, { status: 404 });

    rider.outgoingRequests = rider.outgoingRequests || [];
    rider.outgoingRequests.push(newRequest._id);
    await rider.save();

    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) return NextResponse.json({ error: "ride not found" }, { status: 404 });

      ride.requestedRiders = ride.requestedRiders || [];
      ride.requestedRiders.push(riderId);
      await ride.save();

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });

      driver.incomingRequests = driver.incomingRequests || [];
      newRequest.requestReceiver = driverId;
      driver.incomingRequests.push(newRequest._id);
      await Promise.all([driver.save(), newRequest.save()]);

      // 🔔 Send push notification
      if (driver.pushToken) {
        await admin.messaging().send({
          token: driver.pushToken,
          notification: {
            title: "🚗 New Ride Request",
            body: `Rider ${rider.firstName} requests a ride from (${beginLocation.lat},${beginLocation.long})`,
          },
          data: {
            requestId: newRequest._id.toString(),
            riderId: riderId.toString(),
          },
        });
      }

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

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

