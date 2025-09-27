import { NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await RequestModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
