import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  order: z.number().int().default(0),
});

// GET - Получить изображения сессии
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const images = await prisma.sessionImage.findMany({
    where: { sessionLogId: params.id },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json(images);
}

// POST - Добавить изображение в сессию
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionLog = await prisma.sessionLog.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: { players: { select: { userId: true } } },
      },
    },
  });

  if (!sessionLog) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Мастер или игрок кампании может добавлять изображения
  const isMaster = sessionLog.company.masterId === session.user.id;
  const isPlayer = sessionLog.company.players.some(p => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = addImageSchema.parse(body);

    // Получаем следующий order
    const lastImage = await prisma.sessionImage.findFirst({
      where: { sessionLogId: params.id },
      orderBy: { order: 'desc' },
    });

    const image = await prisma.sessionImage.create({
      data: {
        ...data,
        sessionLogId: params.id,
        uploadedBy: session.user.id,
        order: data.order || (lastImage?.order || 0) + 1,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить изображение
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get('imageId');

  if (!imageId) {
    return NextResponse.json({ error: 'imageId required' }, { status: 400 });
  }

  const image = await prisma.sessionImage.findUnique({
    where: { id: imageId },
    include: {
      sessionLog: {
        include: { company: true },
      },
    },
  });

  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  // Мастер или тот кто загрузил может удалить
  const isMaster = image.sessionLog.company.masterId === session.user.id;
  const isUploader = image.uploadedBy === session.user.id;

  if (!isMaster && !isUploader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.sessionImage.delete({ where: { id: imageId } });

  return NextResponse.json({ success: true });
}
