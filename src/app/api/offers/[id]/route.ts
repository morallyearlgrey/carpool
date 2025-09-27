import { NextResponse } from 'next/server';
import OfferModel from '@/lib/models/offer';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await OfferModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
  }
}
