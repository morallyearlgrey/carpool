import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import mongooseConnect from '@/lib/mongoose';
import Schedule from '@/lib/models/schedule';
import User from '@/lib/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
  // ensure DB client and mongoose are initialized
  await clientPromise;
  await mongooseConnect;
    const body = await req.json();
  const { availableTimes } = body;

    // authenticate server-side and derive userId from session
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }
    if (!availableTimes) {
      return NextResponse.json({ error: 'missing availableTimes' }, { status: 400 });
    }

    // Validate minimal shape server-side
    if (!Array.isArray(availableTimes)) {
      return NextResponse.json({ error: 'availableTimes must be an array' }, { status: 400 });
    }

    // Basic per-item validation
    for (let i = 0; i < availableTimes.length; i++) {
      const it = availableTimes[i];
      if (!it || typeof it.day !== 'string') return NextResponse.json({ error: `availableTimes[${i}].day missing or invalid` }, { status: 400 });
      if (!it.startTime || typeof it.startTime !== 'string') return NextResponse.json({ error: `availableTimes[${i}].startTime missing or invalid` }, { status: 400 });
      if (!it.endTime || typeof it.endTime !== 'string') return NextResponse.json({ error: `availableTimes[${i}].endTime missing or invalid` }, { status: 400 });
      if (!it.beginLocation || typeof it.beginLocation.lat !== 'number' || typeof it.beginLocation.long !== 'number') return NextResponse.json({ error: `availableTimes[${i}].beginLocation missing or invalid` }, { status: 400 });
      if (!it.finalLocation || typeof it.finalLocation.lat !== 'number' || typeof it.finalLocation.long !== 'number') return NextResponse.json({ error: `availableTimes[${i}].finalLocation missing or invalid` }, { status: 400 });
    }

    // Log incoming payload and session for debugging
    console.debug('Upsert schedule payload for user:', userId, { count: availableTimes.length });

    // Upsert: one Schedule per user
    const existing = await Schedule.findOne({ user: userId });
    if (existing) {
      existing.availableTimes = availableTimes;
      await existing.save();
      // ensure user.schedule points to this doc
      await User.findByIdAndUpdate(userId, { schedule: existing._id });
      return NextResponse.json({ ok: true, schedule: existing });
    }

    const created = await Schedule.create({ user: userId, availableTimes });
    await User.findByIdAndUpdate(userId, { schedule: created._id });
    return NextResponse.json({ ok: true, schedule: created });
  } catch (err: any) {
    console.error('Error in /api/schedule:', err?.message || err, err?.stack ? err.stack.split('\n').slice(0,3).join('\n') : undefined);
    const detail = process.env.NODE_ENV === 'production' ? 'server error' : (err?.message || String(err));
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await clientPromise;
    await mongooseConnect;
    const session = await getServerSession(authOptions as any);
    const userId = (session as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

    const existing = await Schedule.findOne({ user: userId });
    if (!existing) return NextResponse.json({ ok: true, schedule: null });
    return NextResponse.json({ ok: true, schedule: existing });
  } catch (err: any) {
    console.error('Error in GET /api/schedule:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'server error' }, { status: 500 });
  }
}
