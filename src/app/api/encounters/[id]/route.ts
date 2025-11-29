import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEncounterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  detailedDesc: z.string().optional(),
  type: z.enum(['COMBAT', 'SOCIAL', 'EXPLORATION', 'MIXED']).optional(),
  order: z.number().int().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encounter = await prisma.encounter.findUnique({
    where: { id: params.id },
    include: {
      company: {
        include: {
          master: { select: { id: true, name: true, email: true, avatar: true } },
          players: { select: { userId: true } },
        },
      },
      notes: {
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      children: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  // Check access
  const isMaster = encounter.company.masterId === session.user.id;
  const isPlayer = encounter.company.players.some((p) => p.userId === session.user.id);

  if (!isMaster && !isPlayer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Filter notes based on privacy
  const filteredNotes = encounter.notes.filter((note) => {
    if (note.privacy === 'PUBLIC') return true;
    if (note.privacy === 'PRIVATE_AUTHOR' && note.authorId === session.user.id) return true;
    if (note.privacy === 'PRIVATE_MASTER' && isMaster) return true;
    if (note.privacy === 'VISIBLE_TO_SUBSET') {
      const visibleToArray = note.visibleTo ? note.visibleTo.split(',') : [];
      if (visibleToArray.includes(session.user.id!)) return true;
    }
    return false;
  });

  return NextResponse.json({ ...encounter, notes: filteredNotes });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encounter = await prisma.encounter.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  if (encounter.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateEncounterSchema.parse(body);

    const updated = await prisma.encounter.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encounter = await prisma.encounter.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
  }

  if (encounter.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.encounter.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
