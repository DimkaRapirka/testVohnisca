import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

// GET - Получить локации части
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const part = await prisma.part.findUnique({
    where: { id: params.id },
    include: { company: { include: { players: true } } },
  });

  if (!part) {
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });
  }

  const isMaster = part.company.masterId === session.user.id;
  const isPlayer = part.company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const locations = await prisma.location.findMany({
    where: {
      partId: params.id,
      ...(isMaster ? {} : { isPublished: true }),
    },
    orderBy: { order: 'asc' },
  });

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

  if (part.company.masterId !== session.user.id) {
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
