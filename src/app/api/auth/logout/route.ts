import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  (await cookies()).set('session', '', { expires: new Date(0), httpOnly: true });
  return NextResponse.json({ success: true }, { status: 200 });
}
