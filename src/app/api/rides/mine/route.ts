import { NextRequest, NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongoose';
import User from '@/lib/models/user';
import Ride from '@/lib/models/ride';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await mongooseConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("id");
        if (!userId) {
              return NextResponse.json({ error: "Missing user id" }, { status: 400 });
        }

        const mineRides = await Ride.find({
            driver: userId

        }).populate({
            path: 'riders.user', // populate each rider's user
            select: 'firstName lastName email' // pick the fields you need
        })
        .populate({
            path: 'riders.request', // optional: populate the request info
            select: 'startTime finalTime status'
        });

        return NextResponse.json({ rides: mineRides });
        
    } catch (err) {
        console.error("Incoming requests GET error:", err);
        return NextResponse.json({ error: "Failed to fetch mine rides" }, { status: 500 });
    }

}

// yuhhhhh