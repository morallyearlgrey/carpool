import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, beginLocation, finalLocation, date, startTime, finalTime } = body;
    if (!userId || !beginLocation || !finalLocation || !date || !startTime || !finalTime) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    const newRequest = await RequestModel.create({
      user: userId,
      beginLocation,
      finalLocation,
      date: new Date(date),
      startTime,
      finalTime,
    });

    return NextResponse.json({ ok: true, requestId: newRequest._id });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
