import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isMaster, hasCompanyAccess } from '@/lib/privacy';
import { z } from 'zod';

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1),
  detailedNotes: z.string().optional(),
  playedAt: z.string().optional(), // ISO date string
  duration: z.number().int().optional(),
  isPublished: z.boolean().default(true),
  participants: z.array(z.object({
    characterId: z.string().optional(),
    characterName: z.string(),
    wasPresent: z.boolean().default(true),
    notes: z.string().optional(),
  })).optional(),
});

// GET - Получить хронику сессий
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      players: { select: { userId: true } },
    },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const playerIds = company.players.map((p) => p.userId);
  const userIsMaster = isMaster(session.user.id, company.masterId);
  const hasAccess = hasCompanyAccess(session.user.id, company.masterId, playerIds);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sessions = await prisma.sessionLog.findMany({
    where: {
      companyId: params.id,
      // Игроки видят только опубликованные
      ...(userIsMaster ? {} : { isPublished: true }),
    },
    include: {
      participants: true,
    },
    orderBy: { playedAt: 'desc' },
  });

  // Для игроков убираем детальные заметки мастера
  if (!userIsMaster) {
    return NextResponse.json(
      sessions.map(({ detailedNotes, ...s }) => s)
    );
  }

  return NextResponse.json(sessions);
}

// POST - Создать запись сессии (только мастер)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can create session logs' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSessionSchema.parse(body);

    // Получаем номер следующей сессии
    const lastSession = await prisma.sessionLog.findFirst({
      where: { companyId: params.id },
      orderBy: { sessionNumber: 'desc' },
    });
    const sessionNumber = (lastSession?.sessionNumber || 0) + 1;

    const sessionLog = await prisma.sessionLog.create({
      data: {
        companyId: params.id,
        title: data.title,
        summary: data.summary,
        detailedNotes: data.detailedNotes,
        playedAt: data.playedAt ? new Date(data.playedAt) : new Date(),
        duration: data.duration,
        isPublished: data.isPublished,
        sessionNumber,
        participants: data.participants ? {
          create: data.participants,
        } : undefined,
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(sessionLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Session log creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
