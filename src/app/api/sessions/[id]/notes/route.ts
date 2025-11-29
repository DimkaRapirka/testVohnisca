import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNoteSchema = z.object({
  content: z.string().min(1),
  isPublic: z.boolean().default(true),
});

// GET - Получить заметки игроков о сессии
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const isMaster = sessionLog.company.masterId === session.user.id;

  // Мастер видит все заметки, игроки - публичные + свои
  const notes = await prisma.sessionPlayerNote.findMany({
    where: {
      sessionLogId: params.id,
      ...(isMaster ? {} : {
        OR: [
          { isPublic: true },
          { userId: session.user.id },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(notes);
}

// POST - Добавить заметку игрока
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionLog = await prisma.sessionLog.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: { players: { select: { userId: true } } },
      },
    },
  });

  if (!sessionLog) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const isMaster = sessionLog.company.masterId === session.user.id;
  const isPlayer = sessionLog.company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createNoteSchema.parse(body);

    const note = await prisma.sessionPlayerNote.create({
      data: {
        ...data,
        sessionLogId: params.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Обновить заметку
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');

  if (!noteId) {
    return NextResponse.json({ error: 'noteId required' }, { status: 400 });
  }

  const note = await prisma.sessionPlayerNote.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  if (note.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createNoteSchema.partial().parse(body);

    const updated = await prisma.sessionPlayerNote.update({
      where: { id: noteId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить заметку
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');

  if (!noteId) {
    return NextResponse.json({ error: 'noteId required' }, { status: 400 });
  }

  const note = await prisma.sessionPlayerNote.findUnique({
    where: { id: noteId },
    include: {
      sessionLog: {
        include: { company: true },
      },
    },
  });

  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  const isMaster = note.sessionLog.company.masterId === session.user.id;
  const isOwner = note.userId === session.user.id;

  if (!isMaster && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.sessionPlayerNote.delete({ where: { id: noteId } });

  return NextResponse.json({ success: true });
}
