import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  if (group.organizerId !== user.id) {
    return NextResponse.json(
      { error: 'Solo el organizador puede añadir participantes directamente' },
      { status: 403 }
    );
  }

  if (group.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'No se pueden añadir participantes después de realizar el sorteo' },
      { status: 400 }
    );
  }

  try {
    const { phone, name } = await req.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Teléfono y nombre son obligatorios' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanName = name.trim();

    // Check if user exists
    let targetUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    let defaultPasswordGenerated = false;
    if (!targetUser) {
      // Create account with a default initial password (e.g. '123456' or phone number)
      const defaultPassword = 'amigo' + cleanPhone.slice(-4);
      const passwordHash = await hashPassword(defaultPassword);
      targetUser = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: cleanName,
          passwordHash,
          isActivated: false,
        },
      });
      defaultPasswordGenerated = true;
    }

    // Check if already in group
    const alreadyMember = group.members.some((m) => m.userId === targetUser.id);
    if (alreadyMember) {
      return NextResponse.json(
        { error: 'Este participante ya está en el grupo' },
        { status: 400 }
      );
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: targetUser.id,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        userId: newMember.user.id,
        name: newMember.user.name,
        phone: newMember.user.phone,
        defaultPasswordGenerated,
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      { error: 'Error al añadir participante' },
      { status: 500 }
    );
  }
}
