import { NextRequest, NextResponse } from "next/server";
import mongooseConnect from "@/lib/mongoose";
import User from "@/lib/models/user";

export async function POST(req: NextRequest) {
  await mongooseConnect;

  const { userId, pushToken } = await req.json();
  if (!userId || !pushToken) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.pushToken = pushToken;
  await user.save();

  return NextResponse.json({ ok: true });
}
