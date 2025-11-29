import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  privacy: z.enum(['PUBLIC', 'PRIVATE_MASTER', 'PRIVATE_AUTHOR', 'VISIBLE_TO_SUBSET']),
  visibleTo: z.string().default(''),
  encounterId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createNoteSchema.parse(body);

    // Check if user has access to the encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id: data.encounterId },
      include: {
        company: {
          include: {
            players: { select: { userId: true } },
          },
        },
      },
    });

    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    const isMaster = encounter.company.masterId === session.user.id;
    const isPlayer = encounter.company.players.some((p) => p.userId === session.user.id);

    if (!isMaster && !isPlayer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const note = await prisma.note.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
