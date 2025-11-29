import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема для переключения видимости
const toggleVisibilitySchema = z.object({
  entityType: z.enum(['part', 'location', 'npc', 'creature', 'loot', 'event', 'wiki']),
  entityId: z.string(),
  isPublished: z.boolean(),
});

// POST - Переключить видимость элемента (только мастер)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { entityType, entityId, isPublished } = toggleVisibilitySchema.parse(body);

    // Проверяем права мастера в зависимости от типа сущности
    let result;

    switch (entityType) {
      case 'part': {
        const part = await prisma.part.findUnique({
          where: { id: entityId },
          include: { company: true },
        });
        if (!part || part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.part.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'location': {
        const location = await prisma.location.findUnique({
          where: { id: entityId },
          include: { part: { include: { company: true } } },
        });
        if (!location || location.part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.location.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'npc': {
        const npc = await prisma.npc.findUnique({
          where: { id: entityId },
          include: { location: { include: { part: { include: { company: true } } } } },
        });
        if (!npc?.location || npc.location.part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.npc.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'creature': {
        const creature = await prisma.locationCreature.findUnique({
          where: { id: entityId },
          include: { location: { include: { part: { include: { company: true } } } } },
        });
        if (!creature || creature.location.part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.locationCreature.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'loot': {
        const loot = await prisma.lootItem.findUnique({
          where: { id: entityId },
          include: { location: { include: { part: { include: { company: true } } } } },
        });
        if (!loot || loot.location.part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.lootItem.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'event': {
        const event = await prisma.event.findUnique({
          where: { id: entityId },
          include: { part: { include: { company: true } } },
        });
        if (!event?.part || event.part.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.event.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      case 'wiki': {
        const wiki = await prisma.wikiEntry.findUnique({
          where: { id: entityId },
          include: { company: true },
        });
        if (!wiki || wiki.company.masterId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        result = await prisma.wikiEntry.update({
          where: { id: entityId },
          data: { isPublished },
        });
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Visibility toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
