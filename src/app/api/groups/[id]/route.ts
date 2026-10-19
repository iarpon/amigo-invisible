import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
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
      organizer: {
        select: { id: true, name: true, phone: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, phone: true },
          },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  // Check if current user is member or organizer
  const userMember = group.members.find((m) => m.userId === user.id);
  const isOrganizer = group.organizerId === user.id;

  if (!userMember && !isOrganizer) {
    return NextResponse.json(
      { error: 'No tienes acceso a este grupo' },
      { status: 403 }
    );
  }

  // Find target if drawn
  let targetUser = null;
  if (group.status === 'DRAWN' && userMember?.targetUserId) {
    const targetMember = group.members.find(
      (m) => m.userId === userMember.targetUserId
    );
    if (targetMember) {
      targetUser = {
        id: targetMember.user.id,
        name: targetMember.user.name,
        phone: targetMember.user.phone,
        wishlist: targetMember.wishlist,
      };
    }
  }

  // Sanitize members list so no one can see secret santa assignments
  const sanitizedMembers = group.members.map((m) => {
    let exclusions: string[] = [];
    try {
      exclusions = JSON.parse(m.exclusions || '[]');
    } catch {
      exclusions = [];
    }
    return {
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      phone: m.user.phone,
      hasTarget: !!m.targetUserId,
      exclusions,
      createdAt: m.createdAt,
    };
  });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      budget: group.budget,
      eventDate: group.eventDate,
      status: group.status,
      inviteCode: group.inviteCode,
      organizer: group.organizer,
      createdAt: group.createdAt,
    },
    isOrganizer,
    isMember: !!userMember,
    myMemberId: userMember?.id,
    myWishlist: userMember?.wishlist || '',
    myTarget: targetUser,
    members: sanitizedMembers,
  });
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
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  if (group.organizerId !== user.id) {
    return NextResponse.json(
      { error: 'Solo el organizador puede eliminar el grupo' },
      { status: 403 }
    );
  }

  await prisma.group.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
