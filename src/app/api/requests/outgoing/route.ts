import { NextRequest, NextResponse } from "next/server";
import mongooseConnect from "@/lib/mongoose";
import Request from "@/lib/models/request";

export async function GET(req: NextRequest) {
  try {
  await mongooseConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    // Find all requests where this user is the sender (outgoing requests)
    const outgoingRequests = await Request.find({
      requestSender: userId
    }).populate('requestReceiver', 'firstName lastName email');

    return NextResponse.json({ requests: outgoingRequests });
  } catch (err) {
    console.error("Outgoing requests GET error:", err);
    return NextResponse.json({ error: "Failed to fetch outgoing requests" }, { status: 500 });
  }
}