// src/app/api/offers/route.ts
import { NextResponse } from 'next/server';
import OfferModel from '@/lib/models/offer';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const offer = await OfferModel.create({
      requestSender: body.userId,
      requestReceiver: body.userId,
      beginLocation: body.beginLocation,
      finalLocation: body.finalLocation,
      date: body.date,
      startTime: body.startTime,
      finalTime: body.finalTime,
    });
    return NextResponse.json({ offer });
  } catch (err) {
    console.error('Offer POST error:', err);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}

// Optional: you could add GET here if you want all offers
