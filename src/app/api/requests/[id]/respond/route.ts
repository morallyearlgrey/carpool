import { NextRequest, NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongoose';
import RequestModel from '@/lib/models/request';
import User from '@/lib/models/user';
import Ride from '@/lib/models/ride';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await mongooseConnect();
    const actionBody = await req.json();
    const action = actionBody.action as 'accept' | 'reject';
    const driverId = actionBody.driverId; // For public request claims
    const { id: requestId } = await (params as any);

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
    }

    const request: any = await RequestModel.findById(requestId).lean();
    if (!request) return NextResponse.json({ error: 'request not found' }, { status: 404 });

    const riderId = request.requestSender?.toString();
    
    // For public requests being claimed, use the provided driverId
    // For regular incoming requests, use the requestReceiver
    const finalDriverId = driverId || request.requestReceiver?.toString();

    if (!finalDriverId || !riderId) return NextResponse.json({ error: 'invalid request data' }, { status: 400 });

    if (action === 'accept') {
      // Create a new Ride and attach rider
      const ride = await Ride.create({
        driver: finalDriverId,
        riders: [{ user: riderId, request: requestId }],
        date: request.date,
        startTime: request.startTime,
        endTime: request.finalTime,
        beginLocation: request.beginLocation,
        finalLocation: request.finalLocation,
        requestedRiders: [],
        maxRiders: 4,
      });

      // Push ride id to driver's rides
      await User.findByIdAndUpdate(finalDriverId, { 
        $push: { rides: ride._id }, 
        $pull: { incomingRequests: requestId } 
      });

      // Remove from rider's outgoingRequests and set user's currentRide
      await User.findByIdAndUpdate(riderId, { 
        $pull: { outgoingRequests: requestId }, 
        $push: { rides: ride._id }, 
        currentRide: ride._id 
      });

      // mark request accepted
      await RequestModel.findByIdAndUpdate(requestId, { status: 'accepted' });

      return NextResponse.json({ ok: true, rideId: ride._id });
    }

    // reject
    // mark request rejected and remove from lists
    await RequestModel.findByIdAndUpdate(requestId, { status: 'rejected' });
    await User.findByIdAndUpdate(finalDriverId, { $pull: { incomingRequests: requestId } });
    await User.findByIdAndUpdate(riderId, { $pull: { outgoingRequests: requestId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Request respond error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}