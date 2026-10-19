import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateDraw } from '@/lib/draw';

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
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  if (group.organizerId !== user.id) {
    return NextResponse.json(
      { error: 'Solo el organizador puede realizar el sorteo' },
      { status: 403 }
    );
  }

  if (group.members.length < 2) {
    return NextResponse.json(
      { error: 'Se necesitan al menos 2 participantes para realizar el sorteo' },
      { status: 400 }
    );
  }

  try {
    const userIds = group.members.map((m) => m.userId);
    const exclusionsMap: Record<string, string[]> = {};
    for (const m of group.members) {
      try {
        exclusionsMap[m.userId] = JSON.parse(m.exclusions || '[]');
      } catch {
        exclusionsMap[m.userId] = [];
      }
    }

    const drawAssignments = calculateDraw(userIds, exclusionsMap);

    // Save assignments in transaction
    await prisma.$transaction(async (tx) => {
      for (const assignment of drawAssignments) {
        await tx.groupMember.update({
          where: {
            groupId_userId: {
              groupId: group.id,
              userId: assignment.giverId,
            },
          },
          data: {
            targetUserId: assignment.receiverId,
          },
        });
      }

      await tx.group.update({
        where: { id: group.id },
        data: {
          status: 'DRAWN',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: '¡Sorteo realizado con éxito!',
    });
  } catch (error: unknown) {
    console.error('Draw execution error:', error);
    const message = error instanceof Error ? error.message : 'Error al realizar el sorteo';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
