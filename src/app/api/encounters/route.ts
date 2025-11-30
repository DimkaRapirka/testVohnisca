import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEncounterSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  detailedDesc: z.string().optional(),
  type: z.enum(['COMBAT', 'SOCIAL', 'EXPLORATION', 'MIXED']).default('MIXED'),
  companyId: z.string(),
  parentId: z.string().optional(),
  order: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createEncounterSchema.parse(body);

    // Check if user is master or player of the company
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
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

    const encounter = await prisma.encounter.create({
      data,
      include: {
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(encounter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
