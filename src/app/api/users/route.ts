import { NextResponse } from 'next/server';
import User from '@/lib/models/user';

export async function GET() {
  try {
    const users = await User.find({}).select('-password'); // Exclude password from response
    return NextResponse.json({ users });
  } catch (err) {
    console.error('Users GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}