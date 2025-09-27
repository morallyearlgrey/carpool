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
      requestSender: riderId, // This now matches the schema
      requestReceiver: driverId,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
      status: 'pending',
      ...(rideId && { associatedRide: rideId }) // Add rideId if provided
    });

    // Update the requester's outgoing requests
    await User.findByIdAndUpdate(
      riderId, 
      { $push: { outgoingRequests: newRequest._id } }
    );

    // If rideId provided, attach to ride.requestedRiders for driver review
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) return NextResponse.json({ error: 'ride not found' }, { status: 404 });

      ride.requestedRiders = ride.requestedRiders || [];
      if (!ride.requestedRiders.includes(riderId)) {
        ride.requestedRiders.push(riderId);
        await ride.save();
      }

      // Also update driver's incoming requests if we have a driverId
      if (driverId) {
        await User.findByIdAndUpdate(
          driverId,
          { $push: { incomingRequests: newRequest._id } }
        );
      }

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If a driverId is supplied (schedule-based candidate), attach request to user.incomingRequests
    if (driverId) {
      const driver = await User.findByIdAndUpdate(
        driverId,
        { $push: { incomingRequests: newRequest._id } },
        { new: true }
      );
      
      if (!driver) return NextResponse.json({ error: 'driver not found' }, { status: 404 });

      return NextResponse.json({ ok: true, requestId: newRequest._id });
    }

    // If neither rideId nor driverId provided, return success but warn
    return NextResponse.json({ 
      ok: true, 
      requestId: newRequest._id, 
      warning: 'no rideId or driverId attached; request stored standalone' 
    });
  } catch (err: any) {
    console.error('Request creation error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}