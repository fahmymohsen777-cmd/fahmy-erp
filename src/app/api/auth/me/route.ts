import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function GET() {
  const session = (await cookies()).get('session')?.value;
  
  if (!session) {
    return NextResponse.json({ authenticated: false, role: null }, { status: 401 });
  }

  try {
    const payload = await decrypt(session);
    return NextResponse.json({ authenticated: true, role: payload.role, username: payload.username }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ authenticated: false, role: null }, { status: 401 });
  }
}
