import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMapSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().min(1),
  parentMapId: z.string().optional(),
  isPublished: z.boolean().default(false),
  visibleToPlayers: z.string().default(''), // ID участников через запятую
  order: z.number().int().default(0),
});

// GET - Получить карты компании
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { players: { select: { userId: true } } },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const isMaster = company.masterId === session.user.id;
  const isPlayer = company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Получаем корневые карты (без родителя)
  let maps = await prisma.companyMap.findMany({
    where: {
      companyId: params.id,
      parentMapId: null,
      ...(isMaster ? {} : { isPublished: true }),
    },
    include: {
      childMaps: {
        where: isMaster ? {} : { isPublished: true },
        select: { id: true, name: true, isPublished: true, visibleToPlayers: true },
      },
      markers: {
        where: isMaster ? {} : { isPublished: true },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Фильтруем карты по видимости для конкретных игроков
  if (!isMaster) {
    maps = maps.filter(map => {
      if (!map.visibleToPlayers) return true; // Пусто = видна всем
      const visibleIds = map.visibleToPlayers.split(',').filter(Boolean);
      return visibleIds.length === 0 || visibleIds.includes(session.user.id!);
    });

    // Фильтруем дочерние карты
    maps = maps.map(map => ({
      ...map,
      childMaps: map.childMaps.filter(child => {
        if (!child.visibleToPlayers) return true;
        const visibleIds = child.visibleToPlayers.split(',').filter(Boolean);
        return visibleIds.length === 0 || visibleIds.includes(session.user.id!);
      }),
    }));
  }

  return NextResponse.json(maps);
}

// POST - Создать карту (только мастер)
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
    return NextResponse.json({ error: 'Only master can create maps' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createMapSchema.parse(body);

    const map = await prisma.companyMap.create({
      data: {
        ...data,
        companyId: params.id,
      },
      include: {
        markers: true,
        childMaps: true,
      },
    });

    return NextResponse.json(map);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Map creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
