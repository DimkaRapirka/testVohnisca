import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMaster, hasCompanyAccess } from '@/lib/privacy';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  masterNotes: z.string().optional(),
  publicDesc: z.string().optional(),
  imageUrl: z.string().optional(),
  mapUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
  order: z.number().int().default(0),
});

// GET - Получить все локации части
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const part = await prisma.part.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: {
          players: { select: { userId: true } },
        },
      },
    },
  });

  if (!part) {
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });
  }

  const playerIds = part.company.players.map((p) => p.userId);
  const userIsMaster = isMaster(session.user.id, part.company.masterId);
  const hasAccess = hasCompanyAccess(session.user.id, part.company.masterId, playerIds);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Проверяем, опубликована ли часть для игрока
  if (!userIsMaster && !part.isPublished) {
    return NextResponse.json({ error: 'Part not available' }, { status: 403 });
  }

  const locations = await prisma.location.findMany({
    where: { partId: params.id },
    include: {
      npcs: true,
      creatures: true,
      lootItems: true,
      events: true,
    },
    orderBy: { order: 'asc' },
  });

  // Фильтруем для игрока
  if (!userIsMaster) {
    const filteredLocations = locations
      .filter((loc) => loc.isPublished)
      .map((loc) => {
        const { masterNotes, ...publicLoc } = loc;
        return {
          ...publicLoc,
          npcs: loc.npcs.filter((npc) => npc.isPublished).map(({ masterNotes, ...npc }) => npc),
          creatures: loc.creatures.filter((c) => c.isPublished).map(({ masterNotes, ...c }) => c),
          lootItems: loc.lootItems.filter((l) => l.isPublished).map(({ masterNotes, ...l }) => l),
          events: loc.events.filter((e) => e.isPublished).map(({ masterNotes, ...e }) => e),
        };
      });
    return NextResponse.json(filteredLocations);
  }

  return NextResponse.json(locations);
}

// POST - Создать локацию (только мастер)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const part = await prisma.part.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!part) {
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });
  }

  if (!isMaster(session.user.id, part.company.masterId)) {
    return NextResponse.json({ error: 'Only master can create locations' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createLocationSchema.parse(body);

    const location = await prisma.location.create({
      data: {
        ...data,
        partId: params.id,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
