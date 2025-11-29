import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isMaster, hasCompanyAccess, filterPartForPlayer } from '@/lib/privacy';
import { z } from 'zod';

const createPartSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  masterContent: z.string().optional(),
  publicContent: z.string().optional(),
  order: z.number().int().default(0),
  isPublished: z.boolean().default(false),
});

// GET - Получить все части кампании
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

  const parts = await prisma.part.findMany({
    where: { companyId: params.id },
    include: {
      locations: {
        include: {
          npcs: true,
          creatures: true,
          lootItems: true,
        },
        orderBy: { order: 'asc' },
      },
      events: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Если пользователь - игрок, фильтруем скрытый контент
  if (!userIsMaster) {
    const filteredParts = parts
      .filter((part) => part.isPublished)
      .map((part) => {
        const { masterContent, ...publicPart } = part;
        return {
          ...publicPart,
          locations: part.locations
            .filter((loc) => loc.isPublished)
            .map((loc) => {
              const { masterNotes, ...publicLoc } = loc;
              return {
                ...publicLoc,
                npcs: loc.npcs.filter((npc) => npc.isPublished).map(({ masterNotes, ...npc }) => npc),
                creatures: loc.creatures.filter((c) => c.isPublished).map(({ masterNotes, ...c }) => c),
                lootItems: loc.lootItems.filter((l) => l.isPublished).map(({ masterNotes, ...l }) => l),
              };
            }),
          events: part.events
            .filter((e) => e.isPublished)
            .map(({ masterNotes, ...e }) => e),
        };
      });
    return NextResponse.json(filteredParts);
  }

  return NextResponse.json(parts);
}

// POST - Создать новую часть (только мастер)
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

  if (!isMaster(session.user.id, company.masterId)) {
    return NextResponse.json({ error: 'Only master can create parts' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createPartSchema.parse(body);

    const part = await prisma.part.create({
      data: {
        ...data,
        companyId: params.id,
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
