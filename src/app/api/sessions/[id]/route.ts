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
    
    // Обновляем основные данные сессии
    const updated = await prisma.sessionLog.update({
      where: { id: params.id },
      data: {
        title: body.title,
        summary: body.summary,
        detailedNotes: body.detailedNotes,
        coverImage: body.coverImage,
        isPublished: body.isPublished,
        playedAt: body.playedAt ? new Date(body.playedAt) : undefined,
        duration: body.duration ? parseInt(body.duration) : undefined,
      },
    });

    // Обновляем локации если переданы
    if (body.locations) {
      // Удаляем старые локации
      await prisma.sessionLocation.deleteMany({
        where: { sessionLogId: params.id },
      });
      
      // Создаём новые
      if (body.locations.length > 0) {
        await prisma.sessionLocation.createMany({
          data: body.locations.map((loc: any, index: number) => ({
            sessionLogId: params.id,
            name: loc.name,
            description: loc.description || null,
            imageUrl: loc.imageUrl || null,
            order: index,
          })),
        });
      }
    }

    // Обновляем участников если переданы
    if (body.participants) {
      await prisma.sessionParticipant.deleteMany({
        where: { sessionLogId: params.id },
      });
      
      if (body.participants.length > 0) {
        await prisma.sessionParticipant.createMany({
          data: body.participants.map((p: any) => ({
            sessionLogId: params.id,
            characterId: p.characterId || null,
            characterName: p.characterName,
            wasPresent: p.wasPresent ?? true,
            notes: p.notes || null,
          })),
        });
      }
    }

    // Возвращаем обновлённую сессию с локациями
    const result = await prisma.sessionLog.findUnique({
      where: { id: params.id },
      include: {
        participants: true,
        locations: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить сессию (только мастер)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: 'Only master can delete sessions' }, { status: 403 });
  }

  await prisma.sessionLog.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
