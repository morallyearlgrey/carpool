// src/app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import RequestModel from '@/lib/models/request';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await RequestModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
