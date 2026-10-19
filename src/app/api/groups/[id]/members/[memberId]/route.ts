import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await params;
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
      { error: 'Solo el organizador puede eliminar participantes' },
      { status: 403 }
    );
  }

  if (group.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'No se puede modificar la lista después de realizado el sorteo' },
      { status: 400 }
    );
  }

  await prisma.groupMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ success: true });
}
