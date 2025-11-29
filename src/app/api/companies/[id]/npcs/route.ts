import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNpcSchema = z.object({
  name: z.string().min(1).max(100),
  class: z.string().default('NPC'),
  race: z.string().optional(),
  level: z.number().int().min(1).max(30).default(1),
  background: z.string().optional(),
  avatarUrl: z.string().optional(),
  
  // NPC специфичные поля
  backstory: z.string().optional(),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  quote: z.string().optional(),
  
  // Характеристики (опционально для NPC)
  maxHp: z.number().int().min(1).default(10),
  hp: z.number().int().optional(),
  ac: z.number().int().min(0).default(10),
  strength: z.number().int().min(1).max(30).default(10),
  dexterity: z.number().int().min(1).max(30).default(10),
  constitution: z.number().int().min(1).max(30).default(10),
  intelligence: z.number().int().min(1).max(30).default(10),
  wisdom: z.number().int().min(1).max(30).default(10),
  charisma: z.number().int().min(1).max(30).default(10),
  
  notes: z.string().optional(),
  isPublic: z.boolean().default(false), // NPC по умолчанию скрыты
});

// GET - Получить NPC кампании
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

  const isMaster = company.masterId === session.user.id;
  const isPlayer = company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Мастер видит всех NPC, игроки только публичных
  const npcs = await prisma.character.findMany({
    where: {
      companyId: params.id,
      characterType: 'npc',
      ...(isMaster ? {} : { isPublic: true }),
    },
    include: {
      milestones: {
        orderBy: { date: 'desc' },
        take: 3,
      },
      _count: {
        select: { milestones: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(npcs);
}

// POST - Создать NPC (только мастер)
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
    return NextResponse.json({ error: 'Only master can create NPCs' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createNpcSchema.parse(body);

    const npc = await prisma.character.create({
      data: {
        ...data,
        hp: data.hp ?? data.maxHp,
        characterType: 'npc',
        userId: session.user.id,
        companyId: params.id,
      },
      include: {
        milestones: true,
      },
    });

    return NextResponse.json(npc);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
