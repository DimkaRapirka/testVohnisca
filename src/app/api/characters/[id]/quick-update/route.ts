import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Быстрое обновление HP/AC/Gold/Silver/Copper для мастера во время сессии
const quickUpdateSchema = z.object({
  hp: z.number().int().optional(),
  maxHp: z.number().int().min(1).optional(),
  ac: z.number().int().min(0).optional(),
  gold: z.number().int().min(0).optional(),
  silver: z.number().int().min(0).optional(),
  copper: z.number().int().min(0).optional(),
  level: z.number().int().min(1).max(20).optional(),
  experience: z.number().int().min(0).optional(),
});

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

  // Только мастер или владелец
  const isOwner = character.userId === session.user.id;
  const isMaster = character.company?.masterId === session.user.id;

  if (!isOwner && !isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = quickUpdateSchema.parse(body);

    // Валидация HP не больше maxHp
    if (data.hp !== undefined && data.maxHp === undefined) {
      if (data.hp > character.maxHp) {
        data.hp = character.maxHp;
      }
    }

    const updated = await prisma.character.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        hp: true,
        maxHp: true,
        ac: true,
        gold: true,
        level: true,
        experience: true,
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
