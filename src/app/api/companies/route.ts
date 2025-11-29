import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  extendedDesc: z.string().optional(),
  genre: z.string().optional(),
  partyLevel: z.number().int().min(1).max(20).default(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { masterId: session.user.id },
        { players: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      master: { select: { id: true, name: true, email: true, avatar: true } },
      players: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      _count: { select: { encounters: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createCompanySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        ...data,
        masterId: session.user.id,
      },
      include: {
        master: { select: { id: true, name: true, email: true, avatar: true } },
        players: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
