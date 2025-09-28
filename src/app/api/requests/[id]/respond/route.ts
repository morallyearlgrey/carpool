// src/app/api/requests/[id]/respond/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongoose';
import RequestModel from '@/lib/models/request';
import User from '@/lib/models/user';
import Ride from '@/lib/models/ride';
import { Types } from 'mongoose';

interface RequestDoc {
  _id: Types.ObjectId;
  requestSender?: Types.ObjectId;
  requestReceiver?: Types.ObjectId;
  beginLocation?: { lat: number; long: number };
  finalLocation?: { lat: number; long: number };
  date?: Date;
  startTime?: string;
  finalTime?: string;
  status?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await mongooseConnect();

    const actionBody = await req.json();
    const action = actionBody.action as 'accept' | 'reject';
    const driverFromBody = actionBody.driverId?.toString(); // for public claim
    const { id: requestId } = await params;

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const request = await RequestModel.findById(requestId).lean() as RequestDoc | null;
    if (!request) return NextResponse.json({ error: 'request not found' }, { status: 404 });

    const riderId = request.requestSender?.toString();
    const driverId = request.requestReceiver?.toString() || driverFromBody;

    if (!riderId || !driverId) {
      return NextResponse.json({ error: 'invalid request data' }, { status: 400 });
    }

    if (action === 'accept') {
      // Create the ride
      const ride = await Ride.create({
        driver: driverId,
        riders: [{ user: riderId, request: requestId }],
        date: request.date,
        startTime: request.startTime,
        endTime: request.finalTime,
        beginLocation: request.beginLocation,
        finalLocation: request.finalLocation,
        requestedRiders: [],
        maxRiders: 4,
      });

      // Update driver
      await User.findByIdAndUpdate(driverId, { 
        $push: { rides: ride._id }, 
        $pull: { incomingRequests: requestId } 
      });

      // Update rider
      await User.findByIdAndUpdate(riderId, { 
        $pull: { outgoingRequests: requestId }, 
        $push: { rides: ride._id }, 
        currentRide: ride._id 
      });

      // Update request
      await RequestModel.findByIdAndUpdate(requestId, { status: 'accepted', requestReceiver: driverId });

      return NextResponse.json({ ok: true, rideId: ride._id });
    }

    // Reject
    await RequestModel.findByIdAndUpdate(requestId, { status: 'rejected' });
    await User.findByIdAndUpdate(driverId, { $pull: { incomingRequests: requestId } });
    await User.findByIdAndUpdate(riderId, { $pull: { outgoingRequests: requestId } });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Request respond error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
