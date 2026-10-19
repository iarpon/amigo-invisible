import { NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: getSessionCookieName(),
    value: '',
    path: '/',
    maxAge: 0,
  });
  return res;
}
