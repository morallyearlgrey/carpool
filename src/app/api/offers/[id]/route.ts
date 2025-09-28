import { NextResponse } from 'next/server';
import OfferModel from '@/lib/models/offer';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await OfferModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
  }
}
