import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Schedule from '@/lib/models/schedule';
import User from '@/lib/models/user';

export async function POST(req: NextRequest) {
  try {
  // ensure DB client is initialized
  await clientPromise;
    const body = await req.json();
    const { userId, availableTimes } = body;
    if (!userId || !availableTimes) {
      return NextResponse.json({ error: 'missing userId or availableTimes' }, { status: 400 });
    }

    // Validate minimal shape server-side
    if (!Array.isArray(availableTimes)) {
      return NextResponse.json({ error: 'availableTimes must be an array' }, { status: 400 });
    }

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
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
