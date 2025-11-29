import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  extendedDesc: z.string().optional(),
  genre: z.string().optional(),
  partyLevel: z.number().int().min(1).max(20).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      master: { select: { id: true, name: true, email: true, avatar: true } },
      players: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      encounters: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { notes: true } },
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Check access
  const hasAccess =
    company.masterId === session.user.id ||
    company.players.some((p) => p.userId === session.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateCompanySchema.parse(body);

    const updated = await prisma.company.update({
      where: { id: params.id },
      data,
      include: {
        master: { select: { id: true, name: true, email: true, avatar: true } },
        players: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.company.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
