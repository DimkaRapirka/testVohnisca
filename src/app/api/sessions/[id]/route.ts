import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET - Получить детали сессии
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionLog = await prisma.sessionLog.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: {
          players: { select: { userId: true } },
        },
      },
      participants: true,
      locations: { orderBy: { order: 'asc' } },
      images: { orderBy: { order: 'asc' } },
      playerNotes: {
        where: {
          OR: [
            { isPublic: true },
            { userId: session.user.id },
          ],
        },
      },
    },
  });

  if (!sessionLog) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const playerIds = sessionLog.company.players.map((p) => p.userId);
  const isMaster = sessionLog.company.masterId === session.user.id;
  const hasAccess = isMaster || playerIds.includes(session.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Для игроков убираем детальные заметки мастера
  if (!isMaster) {
    const { detailedNotes, ...publicSession } = sessionLog;
    return NextResponse.json(publicSession);
  }

  return NextResponse.json(sessionLog);
}

// PATCH - Обновить сессию (только мастер)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionLog = await prisma.sessionLog.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!sessionLog) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (sessionLog.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can edit sessions' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.sessionLog.update({
      where: { id: params.id },
      data: {
        title: body.title,
        summary: body.summary,
        detailedNotes: body.detailedNotes,
        coverImage: body.coverImage,
        isPublished: body.isPublished,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
