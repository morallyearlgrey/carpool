import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import User from '@/lib/models/user';
import mongooseConnect from "@/lib/mongoose";

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;

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

    // Fetch the user document
    const user = await User.findOne({ user: userId });

    // Push the new request ID to outgoingRequests and save
    user.outgoingRequests.push(newRequest._id);
    console.log(user.outgoingRequests + "Help")
    await user.save();

    return NextResponse.json({ ok: true, requestId: newRequest._id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
