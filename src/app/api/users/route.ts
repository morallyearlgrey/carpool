import { NextResponse } from "next/server";
import User from "@/lib/models/user";
import mongooseConnect from '@/lib/mongoose';


export async function GET(req: Request) {
  try {
  await mongooseConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // get single user
      const user = await User.findById(id)
        .populate("currentRide")
        .populate("rides")
        .populate("schedule")
        .populate("incomingRequests")
        .populate("outgoingRequests");

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    } else {
      // get all users
      const users = await User.find({});
      return NextResponse.json({ users });
    }
  } catch (err) {
    console.error("User GET error:", err);
    return NextResponse.json({ error: "Failed to fetch user(s)" }, { status: 500 });
  }
}