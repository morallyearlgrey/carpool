// src/app/api/requests/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import User from '@/lib/models/user';
import Ride from '@/lib/models/ride';
import mongooseConnect from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;
    
    const body = await req.json();
    const { 
      userId, 
      driverId, 
      rideId,
      requestReceiver,
      beginLocation, 
      finalLocation, 
      date, 
      startTime, 
      finalTime 
    } = body;

    // Validate required fields
    if (!userId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!driverId && !requestReceiver) {
      return NextResponse.json({ error: 'Either driverId or requestReceiver must be provided' }, { status: 400 });
    }

    // 1. Create the request document
    const newRequest = await RequestModel.create({
      user: userId,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
      requestReceiver: requestReceiver || driverId, // Add this field to your request model
    });

    // 2. Update the requester's outgoing requests
    await User.findByIdAndUpdate(
      userId, 
      { $push: { requests: newRequest._id } }
    );

    // 3. Update the driver/receiver's incoming requests
    const receiverId = requestReceiver || driverId;
    const receiver = await User.findById(receiverId);
    
    if (!receiver) {
      return NextResponse.json({ error: 'Driver/receiver not found' }, { status: 404 });
    }

    // Add to receiver's incoming requests (you might need to add this field to User model)
    await User.findByIdAndUpdate(
      receiverId,
      { $push: { incomingRequests: newRequest._id } }
    );

    // 4. If there's a specific ride, add the request to that ride's requested riders
    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (ride) {
        // Add the requester to the ride's requestedRiders if not already there
        if (!ride.requestedRiders.includes(userId)) {
          ride.requestedRiders.push(userId);
          await ride.save();
        }
      }
    }

    // 5. You could add notification logic here
    // TODO: Send push notification or email to the driver

    return NextResponse.json({ 
      success: true, 
      requestId: newRequest._id,
      message: 'Request sent successfully'
    });

  } catch (err: any) {
    console.error('Error in /api/requests/send:', err);
    return NextResponse.json({ 
      error: 'Failed to send request',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}