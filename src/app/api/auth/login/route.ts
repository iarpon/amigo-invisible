import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, getSessionCookieName } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Por favor, introduce teléfono y contraseña' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Número de teléfono o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Número de teléfono o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      name: user.name,
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, phone: user.phone, name: user.name },
    });

    res.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno al iniciar sesión' },
      { status: 500 }
    );
  }
}
