import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createInvitationSchema = z.object({
  email: z.string().email().optional(),
  message: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

// GET - Получить все приглашения компании (только мастер)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: 'Only master can view invitations' }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { companyId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invitations);
}

// POST - Создать приглашение (только мастер)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: 'Only master can create invitations' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createInvitationSchema.parse(body);

    // Проверяем, есть ли уже пользователь с таким email
    let invitedUserId: string | null = null;
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        // Проверяем, не является ли уже участником
        const existingMember = await prisma.companyPlayer.findUnique({
          where: {
            companyId_userId: {
              companyId: params.id,
              userId: existingUser.id,
            },
          },
        });
        if (existingMember) {
          return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
        }
        invitedUserId = existingUser.id;
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

    const invitation = await prisma.invitation.create({
      data: {
        companyId: params.id,
        invitedEmail: data.email,
        invitedUserId,
        message: data.message,
        expiresAt,
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
