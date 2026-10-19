import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  if (group.organizerId !== user.id) {
    return NextResponse.json(
      { error: 'Solo el organizador puede reiniciar el sorteo' },
      { status: 403 }
    );
  }

  try {
    await prisma.$transaction([
      prisma.groupMember.updateMany({
        where: { groupId: group.id },
        data: { targetUserId: null },
      }),
      prisma.group.update({
        where: { id: group.id },
        data: { status: 'DRAFT' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Sorteo reiniciado a borrador',
    });
  } catch (error) {
    console.error('Reset draw error:', error);
    return NextResponse.json(
      { error: 'Error al reiniciar el sorteo' },
      { status: 500 }
    );
  }
}
