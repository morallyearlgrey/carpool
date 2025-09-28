import { NextRequest, NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongoose';
import Ride from '@/lib/models/ride';

export async function GET(req: NextRequest) {
  try {
    await mongooseConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const mineRides = await Ride.find({
      $or: [
        { driver: userId },
        { "riders.user": userId },
      ]
    })
      .populate({
        path: "riders.user",
        select: "firstName lastName email", // 👈 this ensures you get names instead of just IDs
      })
      .populate({
        path: "riders.request",
        select: "startTime finalTime status",
      })
      .populate({
        path: "driver",
        select: "firstName lastName email", // optional: get driver details too
      })
      .lean();

    return NextResponse.json({ rides: mineRides });
  } catch (err) {
    console.error("Mine rides GET error:", err);
    return NextResponse.json({ error: "Failed to fetch mine rides" }, { status: 500 });
  }
}
