import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, getSessionCookieName } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone, name, password } = await req.json();

    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: 'Por favor, completa teléfono, nombre y contraseña' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanName = name.trim();

    if (cleanPhone.length < 6) {
      return NextResponse.json(
        { error: 'El número de teléfono debe tener al menos 6 dígitos' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 4 caracteres' },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      if (!existing.isActivated) {
        // User was pre-registered by an organizer! Activate now with their chosen password and name
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: cleanName || existing.name,
            passwordHash,
            isActivated: true,
          },
        });

        const token = await signToken({
          userId: user.id,
          phone: user.phone,
          name: user.name,
        });

        const res = NextResponse.json({
          success: true,
          activated: true,
          user: { id: user.id, phone: user.phone, name: user.name },
        });

        res.cookies.set({
          name: getSessionCookieName(),
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });

        return res;
      }

      return NextResponse.json(
        { error: 'Ya existe una cuenta con este teléfono. Por favor inicia sesión.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        name: cleanName,
        passwordHash,
      },
    });

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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Error interno al registrar usuario' },
      { status: 500 }
    );
  }
}
