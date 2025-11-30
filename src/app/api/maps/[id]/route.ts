import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMapSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
  visibleToPlayers: z.string().optional(),
  order: z.number().int().optional(),
});

// GET - Получить конкретную карту с метками
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const map = await prisma.companyMap.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: { players: { select: { userId: true } } },
      },
      parentMap: { select: { id: true, name: true } },
      childMaps: { 
        select: { 
          id: true, 
          name: true, 
          isPublished: true,
          visibleToPlayers: true,
          description: true,
        },
        orderBy: { order: 'asc' },
      },
      markers: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  const isMaster = map.company.masterId === session.user.id;
  const isPlayer = map.company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Проверяем видимость карты для игрока
  if (!isMaster && map.visibleToPlayers) {
    const visibleIds = map.visibleToPlayers.split(',').filter(Boolean);
    if (visibleIds.length > 0 && !visibleIds.includes(session.user.id!)) {
      return NextResponse.json({ error: 'Map not visible to you' }, { status: 403 });
    }
  }

  // Фильтруем метки и дочерние карты для игроков
  if (!isMaster) {
    map.markers = map.markers.filter(m => m.isPublished);
    map.childMaps = map.childMaps.filter(child => {
      if (!child.isPublished) return false;
      if (!child.visibleToPlayers) return true;
      const visibleIds = child.visibleToPlayers.split(',').filter(Boolean);
      return visibleIds.length === 0 || visibleIds.includes(session.user.id!);
    });
  }

  return NextResponse.json(map);
}

// PATCH - Обновить карту
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const map = await prisma.companyMap.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  if (map.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can edit maps' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateMapSchema.parse(body);

    const updated = await prisma.companyMap.update({
      where: { id: params.id },
      data,
      include: {
        markers: true,
        childMaps: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить карту
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const map = await prisma.companyMap.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  if (map.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can delete maps' }, { status: 403 });
  }

  await prisma.companyMap.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
