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
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  const myMembership = group.members.find((m) => m.userId === user.id);
  if (!myMembership) {
    return NextResponse.json(
      { error: 'No eres participante de este grupo' },
      { status: 403 }
    );
  }

  if (group.status !== 'DRAWN') {
    return NextResponse.json({
      santaThread: { enabled: false, messages: [] },
      targetThread: { enabled: false, messages: [] },
    });
  }

  // 1. Target Thread: Current user is Santa -> gifting to targetUserId
  const targetMember = group.members.find(
    (m) => m.userId === myMembership.targetUserId
  );
  let targetMessages: Array<{
    id: string;
    isMe: boolean;
    senderName: string;
    content: string;
    createdAt: Date;
  }> = [];

  if (targetMember) {
    const rawTargetMessages = await prisma.message.findMany({
      where: {
        groupId: id,
        OR: [
          { senderId: user.id, receiverId: targetMember.userId },
          { senderId: targetMember.userId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    targetMessages = rawTargetMessages.map((msg) => {
      const isMe = msg.senderId === user.id;
      return {
        id: msg.id,
        isMe,
        senderName: isMe ? 'Tú (como Amigo Invisible)' : targetMember.user.name,
        content: msg.content,
        createdAt: msg.createdAt,
      };
    });
  }

  // 2. Santa Thread: Someone in group has targetUserId === user.id
  const santaMember = group.members.find((m) => m.targetUserId === user.id);
  let santaMessages: Array<{
    id: string;
    isMe: boolean;
    senderName: string;
    content: string;
    createdAt: Date;
  }> = [];

  if (santaMember) {
    const rawSantaMessages = await prisma.message.findMany({
      where: {
        groupId: id,
        OR: [
          { senderId: santaMember.userId, receiverId: user.id },
          { senderId: user.id, receiverId: santaMember.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // CRITICAL: NEVER reveal santaMember.userId or santaMember.user.name to current user!
    santaMessages = rawSantaMessages.map((msg) => {
      const isMe = msg.senderId === user.id;
      return {
        id: msg.id,
        isMe,
        senderName: isMe ? 'Tú' : 'Tu Amigo Invisible 🎅',
        content: msg.content,
        createdAt: msg.createdAt,
      };
    });
  }

  return NextResponse.json({
    santaThread: {
      enabled: !!santaMember,
      partnerLabel: 'Tu Amigo Invisible 🎅',
      partnerSubtext: 'Chatea de forma anónima con la persona que te regalará a ti',
      messages: santaMessages,
    },
    targetThread: {
      enabled: !!targetMember,
      partnerLabel: targetMember?.user.name || 'Tu Víctima',
      partnerSubtext: 'Chatea de forma anónima haciéndote pasar por su Amigo Invisible',
      messages: targetMessages,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { thread, content } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    if (thread !== 'santa' && thread !== 'target') {
      return NextResponse.json(
        { error: 'Hilo no válido (debe ser "santa" o "target")' },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group || group.status !== 'DRAWN') {
      return NextResponse.json(
        { error: 'El chat solo está disponible una vez realizado el sorteo' },
        { status: 400 }
      );
    }

    const myMembership = group.members.find((m) => m.userId === user.id);
    if (!myMembership) {
      return NextResponse.json(
        { error: 'No eres miembro del grupo' },
        { status: 403 }
      );
    }

    let receiverId: string | null = null;
    let isAnonymous = false;

    if (thread === 'target') {
      // Current user is writing to their target
      if (!myMembership.targetUserId) {
        return NextResponse.json(
          { error: 'No tienes una víctima asignada' },
          { status: 400 }
        );
      }
      receiverId = myMembership.targetUserId;
      isAnonymous = true; // receiver sees "Tu Amigo Invisible"
    } else {
      // Current user is writing to their secret santa
      const santaMember = group.members.find((m) => m.targetUserId === user.id);
      if (!santaMember) {
        return NextResponse.json(
          { error: 'No se encontró tu amigo invisible' },
          { status: 400 }
        );
      }
      receiverId = santaMember.userId;
      isAnonymous = false; // santa sees the real name of current user
    }

    const message = await prisma.message.create({
      data: {
        groupId: id,
        senderId: user.id,
        receiverId,
        isAnonymous,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
