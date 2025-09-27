// src/app/api/debug/route.ts
import { NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';
import OfferModel from '@/lib/models/offer';

export async function GET() {
  try {
    const requests = await RequestModel.find().lean();
    const offers = await OfferModel.find().lean();
    
    return NextResponse.json({ requests, offers });
  } catch (err) {
    console.error('Debug fetch error:', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
