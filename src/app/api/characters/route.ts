import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  class: z.string().min(1).max(50),
  race: z.string().optional(),
  level: z.number().int().min(1).max(20).default(1),
  background: z.string().optional(),
  alignment: z.string().optional(),
  avatarUrl: z.string().optional(),
  
  // LongStoryShort поля
  backstory: z.string().optional(),
  personality: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  appearance: z.string().optional(),
  quote: z.string().optional(),
  
  // Характеристики
  maxHp: z.number().int().min(1).default(10),
  hp: z.number().int().optional(),
  ac: z.number().int().min(0).default(10),
  strength: z.number().int().min(1).max(30).default(10),
  dexterity: z.number().int().min(1).max(30).default(10),
  constitution: z.number().int().min(1).max(30).default(10),
  intelligence: z.number().int().min(1).max(30).default(10),
  wisdom: z.number().int().min(1).max(30).default(10),
  charisma: z.number().int().min(1).max(30).default(10),
  
  gold: z.number().int().min(0).default(0),
  silver: z.number().int().min(0).default(0),
  copper: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  
  // Тип персонажа и видимость
  characterType: z.enum(['player', 'npc', 'companion']).default('player'),
  isPublic: z.boolean().default(true),
  companyId: z.string().optional(),
});

// GET - Получить персонажей с фильтрацией
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const characterType = searchParams.get('type'); // player, npc, companion, all
  const includePublic = searchParams.get('includePublic') === 'true';

  let whereClause: any = {};

  if (includePublic && companyId) {
    // Для компании: свои персонажи + публичные персонажи других игроков
    whereClause = {
      companyId,
      OR: [
        { userId: session.user.id },
        { isPublic: true },
      ],
    };
  } else {
    // Только свои персонажи
    whereClause = {
      userId: session.user.id,
      ...(companyId ? { companyId } : {}),
    };
  }

  if (characterType && characterType !== 'all') {
    whereClause.characterType = characterType;
  }

  const characters = await prisma.character.findMany({
    where: whereClause,
    include: {
      inventory: true,
      company: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      milestones: {
        orderBy: { date: 'desc' },
        take: 3,
      },
      _count: {
        select: { milestones: true, inventory: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(characters);
}

// POST - Создать персонажа
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createCharacterSchema.parse(body);

    // Если указана компания, проверяем доступ
    if (data.companyId) {
      const membership = await prisma.companyPlayer.findUnique({
        where: {
          companyId_userId: {
            companyId: data.companyId,
            userId: session.user.id,
          },
        },
      });

      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!membership && company?.masterId !== session.user.id) {
        return NextResponse.json({ error: 'Not a member of this company' }, { status: 403 });
      }
    }

    const character = await prisma.character.create({
      data: {
        ...data,
        hp: data.hp ?? data.maxHp,
        userId: session.user.id,
      },
      include: {
        inventory: true,
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Character creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
