// app/api/requests/incoming/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongooseConnect from "@/lib/mongoose";
import Request from "@/lib/models/request";

export async function GET(req: NextRequest) {
  try {
    await mongooseConnect;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    // Find all requests where this user is the receiver (incoming requests)
    const incomingRequests = await Request.find({
      requestReceiver: userId
    }).populate('requestSender', 'firstName lastName email');

    return NextResponse.json({ requests: incomingRequests });
  } catch (err) {
    console.error("Incoming requests GET error:", err);
    return NextResponse.json({ error: "Failed to fetch incoming requests" }, { status: 500 });
  }
}
