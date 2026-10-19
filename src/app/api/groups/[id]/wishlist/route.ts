import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { wishlist } = await req.json();

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      );
    }

    const updated = await prisma.groupMember.update({
      where: { id: member.id },
      data: {
        wishlist: wishlist?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, wishlist: updated.wishlist });
  } catch (error) {
    console.error('Update wishlist error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar lista de deseos' },
      { status: 500 }
    );
  }
}
