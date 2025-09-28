// src/app/api/debug/route.ts
import { NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import OfferModel from '@/lib/models/offer';
import UserModel from '@/lib/models/user';
import RideModel from '@/lib/models/ride';

export async function GET() {
  try {
    // Fetch all collections
    const [requests, offers, users, rides] = await Promise.all([
      RequestModel.find().lean(),
      OfferModel.find().lean(),
      UserModel.find().lean(),
      RideModel.find().lean(),
    ]);

    return NextResponse.json({ requests, offers, users, rides });
  } catch (err) {
    console.error('Debug fetch error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
