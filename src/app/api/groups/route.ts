import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { organizerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      organizer: {
        select: { id: true, name: true, phone: true },
      },
      members: {
        select: {
          id: true,
          userId: true,
          targetUserId: true,
          user: {
            select: { id: true, name: true, phone: true },
          },
        },
      },
      _count: {
        select: { members: true, messages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, description, budget, eventDate } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del grupo es obligatorio' },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        budget: budget?.trim() || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        organizerId: user.id,
        members: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        organizer: {
          select: { id: true, name: true, phone: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Error al crear el grupo' },
      { status: 500 }
    );
  }
}
