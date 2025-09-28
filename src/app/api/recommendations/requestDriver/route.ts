import { NextRequest, NextResponse } from "next/server";
import Ride from "@/lib/models/ride";
import RequestModel from "@/lib/models/request";
import User from "@/lib/models/user";
import mongooseConnect from "@/lib/mongoose";
import admin from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await mongooseConnect();

    // Parse request body
    const { riderId, rideId, driverId, beginLocation, finalLocation, date, startTime, finalTime } =
      await req.json();

    // Validate required fields
    if (!riderId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create new Request document
    const newRequest = await RequestModel.create({
      requestSender: riderId,
      requestReceiver: null,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

    // Update rider's outgoingRequests
    const rider = await User.findById(riderId);
    if (!rider) return NextResponse.json({ error: "Rider not found" }, { status: 404 });

    rider.outgoingRequests = rider.outgoingRequests || [];
    rider.outgoingRequests.push(newRequest._id);
    await rider.save();

    // If rideId is provided, attach to ride's requestedRiders
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

      ride.requestedRiders = ride.requestedRiders || [];
      ride.requestedRiders.push(riderId);
      await ride.save();

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If driverId is provided, attach to driver's incomingRequests
    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

      driver.incomingRequests = driver.incomingRequests || [];
      newRequest.requestReceiver = driverId;
      driver.incomingRequests.push(newRequest._id);

      // Save both driver and request
      await Promise.all([driver.save(), newRequest.save()]);

      // Send push notification if driver has a token
      if (driver.pushToken) {
        await admin.messaging().send({
          token: driver.pushToken,
          notification: {
            title: "🚗 New Ride Request",
            body: `Rider ${rider.firstName} requests a ride from (${beginLocation.lat}, ${beginLocation.long})`,
          },
          data: {
            requestId: newRequest._id.toString(),
            riderId: rider._id.toString(),
          },
        });
      }

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If neither rideId nor driverId provided
    return NextResponse.json({
      ok: true,
      requestId: newRequest._id,
      warning: "No rideId or driverId attached; request stored standalone",
    });
  } catch (err: any) {
    console.error("RequestDriver POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
