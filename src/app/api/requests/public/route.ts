import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import mongooseConnect from '@/lib/mongoose'; // Import the connection

export async function POST(req: NextRequest) {
  try {
    await mongooseConnect;
    const body = await req.json();
    const { userId, driverId, beginLocation, finalLocation, date, startTime, finalTime } = body;
    if (!userId || !driverId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    const newRequest = await RequestModel.create({
      requestSender: userId,
      requestReceiver: driverId,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

    return NextResponse.json({ ok: true, requestId: newRequest._id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
