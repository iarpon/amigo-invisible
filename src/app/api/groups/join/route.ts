import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión para unirte' }, { status: 401 });
  }

  try {
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ error: 'Código de invitación no proporcionado' }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.trim() },
      include: { members: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado con este código' }, { status: 404 });
    }

    if (group.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'El sorteo de este grupo ya ha sido realizado' },
        { status: 400 }
      );
    }

    const alreadyMember = group.members.some((m) => m.userId === user.id);
    if (alreadyMember) {
      return NextResponse.json({ success: true, groupId: group.id, message: 'Ya eres miembro de este grupo' });
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, groupId: group.id });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Error al unirse al grupo' }, { status: 500 });
  }
}
