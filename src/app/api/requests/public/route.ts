import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import User from '@/lib/models/user';
import mongooseConnect from "@/lib/mongoose";

export async function POST(req: NextRequest) {
  try {
  await mongooseConnect();

    const body = await req.json();
    const { userId, beginLocation, finalLocation, date, startTime, finalTime } = body;

    if (!userId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    // Create new request
    const newRequest = await RequestModel.create({
      requestSender: userId,
      requestReceiver: null,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

    // Atomically push the outgoing request id to the user's outgoingRequests
    const updated = await User.findByIdAndUpdate(userId, { $push: { outgoingRequests: newRequest._id } });
    if (!updated) {
      console.warn('Could not find user to attach outgoing request', userId);
    }

    return NextResponse.json({ ok: true, requestId: newRequest._id });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
