import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, getSessionCookieName } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { phone, password, action } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Por favor, introduce tu número de teléfono' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: {
        memberships: {
          include: {
            group: {
              select: { name: true, organizer: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            'No hemos encontrado ninguna invitación asociada a este teléfono. Verifica el número o pide a tu organizador que te registre.',
        },
        { status: 404 }
      );
    }

    // Action: "check" (Step 1)
    if (action === 'check') {
      const groupNames = user.memberships.map((m) => m.group.name);
      const organizerNames = Array.from(
        new Set(user.memberships.map((m) => m.group.organizer.name))
      );

      return NextResponse.json({
        found: true,
        name: user.name,
        isActivated: user.isActivated,
        groups: groupNames,
        organizers: organizerNames,
      });
    }

    // Action: "activate" (Step 2 - set own password and log in)
    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 4 caracteres' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActivated: true,
      },
    });

    const token = await signToken({
      userId: updatedUser.id,
      phone: updatedUser.phone,
      name: updatedUser.name,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        name: updatedUser.name,
      },
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
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Error al activar tu cuenta' },
      { status: 500 }
    );
  }
}
