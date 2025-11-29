import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sessionNumber: z.number().int().optional(),
  iconType: z.string().default('star'),
});

// GET - Получить достижения персонажа
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const milestones = await prisma.characterMilestone.findMany({
    where: { characterId: params.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(milestones);
}

// POST - Добавить достижение
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  const isOwner = character.userId === session.user.id;
  const isMaster = character.company?.masterId === session.user.id;

  if (!isOwner && !isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createMilestoneSchema.parse(body);

    const milestone = await prisma.characterMilestone.create({
      data: {
        ...data,
        characterId: params.id,
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить достижение
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const milestoneId = searchParams.get('milestoneId');

  if (!milestoneId) {
    return NextResponse.json({ error: 'milestoneId required' }, { status: 400 });
  }

  const milestone = await prisma.characterMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      character: {
        include: { company: true },
      },
    },
  });

  if (!milestone) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const isOwner = milestone.character.userId === session.user.id;
  const isMaster = milestone.character.company?.masterId === session.user.id;

  if (!isOwner && !isMaster) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.characterMilestone.delete({ where: { id: milestoneId } });

  return NextResponse.json({ success: true });
}
