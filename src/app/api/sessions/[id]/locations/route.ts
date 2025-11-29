import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().int().default(0),
});

// GET - Получить локации сессии
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const locations = await prisma.sessionLocation.findMany({
    where: { sessionLogId: params.id },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(locations);
}

// POST - Добавить локацию в сессию (только мастер)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionLog = await prisma.sessionLog.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!sessionLog) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (sessionLog.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can add locations' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createLocationSchema.parse(body);

    // Получаем следующий order
    const lastLocation = await prisma.sessionLocation.findFirst({
      where: { sessionLogId: params.id },
      orderBy: { order: 'desc' },
    });

    const location = await prisma.sessionLocation.create({
      data: {
        ...data,
        sessionLogId: params.id,
        order: data.order || (lastLocation?.order || 0) + 1,
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

// DELETE - Удалить локацию
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId required' }, { status: 400 });
  }

  const location = await prisma.sessionLocation.findUnique({
    where: { id: locationId },
    include: {
      sessionLog: {
        include: { company: true },
      },
    },
  });

  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  if (location.sessionLog.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.sessionLocation.delete({ where: { id: locationId } });

  return NextResponse.json({ success: true });
}
