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
    include: { members: true },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  if (group.organizerId !== user.id) {
    return NextResponse.json(
      { error: 'Solo el organizador puede configurar reglas de exclusión' },
      { status: 403 }
    );
  }

  if (group.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'No se pueden modificar reglas después de realizado el sorteo' },
      { status: 400 }
    );
  }

  try {
    const { giverUserId, receiverUserId, isMutual } = await req.json();

    if (!giverUserId || !receiverUserId) {
      return NextResponse.json(
        { error: 'Debes indicar el participante que da y el que no puede recibir' },
        { status: 400 }
      );
    }

    if (giverUserId === receiverUserId) {
      return NextResponse.json(
        { error: 'Un participante nunca se regala a sí mismo' },
        { status: 400 }
      );
    }

    const giverMember = group.members.find((m) => m.userId === giverUserId);
    const receiverMember = group.members.find((m) => m.userId === receiverUserId);

    if (!giverMember || !receiverMember) {
      return NextResponse.json(
        { error: 'Uno de los participantes no pertenece al grupo' },
        { status: 400 }
      );
    }

    // Parse existing giver exclusions
    let giverExclusions: string[] = [];
    try {
      giverExclusions = JSON.parse(giverMember.exclusions || '[]');
    } catch {
      giverExclusions = [];
    }

    if (!giverExclusions.includes(receiverUserId)) {
      giverExclusions.push(receiverUserId);
      await prisma.groupMember.update({
        where: { id: giverMember.id },
        data: { exclusions: JSON.stringify(giverExclusions) },
      });
    }

    // If mutual, also exclude giver from receiver
    if (isMutual) {
      let receiverExclusions: string[] = [];
      try {
        receiverExclusions = JSON.parse(receiverMember.exclusions || '[]');
      } catch {
        receiverExclusions = [];
      }

      if (!receiverExclusions.includes(giverUserId)) {
        receiverExclusions.push(giverUserId);
        await prisma.groupMember.update({
          where: { id: receiverMember.id },
          data: { exclusions: JSON.stringify(receiverExclusions) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add exclusion error:', error);
    return NextResponse.json(
      { error: 'Error al registrar la regla de exclusión' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      { error: 'Solo el organizador puede modificar reglas de exclusión' },
      { status: 403 }
    );
  }

  if (group.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'No se pueden modificar reglas después de realizado el sorteo' },
      { status: 400 }
    );
  }

  try {
    const { giverUserId, receiverUserId, isMutual } = await req.json();

    const giverMember = group.members.find((m) => m.userId === giverUserId);
    if (giverMember) {
      let giverExclusions: string[] = [];
      try {
        giverExclusions = JSON.parse(giverMember.exclusions || '[]');
      } catch {
        giverExclusions = [];
      }
      giverExclusions = giverExclusions.filter((id) => id !== receiverUserId);

      await prisma.groupMember.update({
        where: { id: giverMember.id },
        data: { exclusions: JSON.stringify(giverExclusions) },
      });
    }

    if (isMutual) {
      const receiverMember = group.members.find((m) => m.userId === receiverUserId);
      if (receiverMember) {
        let receiverExclusions: string[] = [];
        try {
          receiverExclusions = JSON.parse(receiverMember.exclusions || '[]');
        } catch {
          receiverExclusions = [];
        }
        receiverExclusions = receiverExclusions.filter((id) => id !== giverUserId);

        await prisma.groupMember.update({
          where: { id: receiverMember.id },
          data: { exclusions: JSON.stringify(receiverExclusions) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exclusion error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la regla de exclusión' },
      { status: 500 }
    );
  }
}
