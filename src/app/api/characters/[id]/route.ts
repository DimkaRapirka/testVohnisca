import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  class: z.string().min(1).max(50).optional(),
  race: z.string().optional(),
  level: z.number().int().min(1).max(20).optional(),
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
  strength: z.number().int().min(1).max(30).optional(),
  dexterity: z.number().int().min(1).max(30).optional(),
  constitution: z.number().int().min(1).max(30).optional(),
  intelligence: z.number().int().min(1).max(30).optional(),
  wisdom: z.number().int().min(1).max(30).optional(),
  charisma: z.number().int().min(1).max(30).optional(),
  
  // Боевые параметры
  hp: z.number().int().min(0).optional(),
  maxHp: z.number().int().min(1).optional(),
  ac: z.number().int().min(0).optional(),
  
  gold: z.number().int().min(0).optional(),
  silver: z.number().int().min(0).optional(),
  copper: z.number().int().min(0).optional(),
  experience: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  
  characterType: z.enum(['player', 'npc', 'companion']).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// GET - Получить персонажа
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      company: {
        select: { id: true, name: true, masterId: true },
      },
      inventory: true,
      milestones: {
        orderBy: { date: 'desc' },
      },
      relationships: {
        include: {
          toCharacter: {
            select: { id: true, name: true, avatarUrl: true, characterType: true },
          },
        },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Проверяем доступ
  const isOwner = character.userId === session.user.id;
  const isMaster = character.company?.masterId === session.user.id;
  const isPublic = character.isPublic;

  if (!isOwner && !isMaster && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(character);
}

// PATCH - Обновить персонажа
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Проверяем права: владелец или мастер кампании
  const isOwner = character.userId === session.user.id;
  const isMaster = character.company?.masterId === session.user.id;

  if (!isOwner && !isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateCharacterSchema.parse(body);

    const updated = await prisma.character.update({
      where: { id: params.id },
      data,
      include: {
        inventory: true,
        milestones: { orderBy: { date: 'desc' } },
        relationships: {
          include: {
            toCharacter: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
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

// DELETE - Удалить персонажа
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const character = await prisma.character.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Владелец или мастер может удалить
  const isOwner = character.userId === session.user.id;
  const isMaster = character.company?.masterId === session.user.id;

  if (!isOwner && !isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.character.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
