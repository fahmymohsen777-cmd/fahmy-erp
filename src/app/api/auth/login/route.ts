import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    let role = null;

    if (username === 'admin' && password === 'admin135790+*') {
      role = 'admin';
    } else if ((username === 'user1' || username === 'user2') && password === 'user123') {
      role = 'viewer';
    }

    if (!role) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    // Set cookie
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ username, role, expires });

    (await cookies()).set('session', session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

    return NextResponse.json({ success: true, role }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
