import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Получить информацию о приглашении по коду
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { inviteCode: params.code },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          description: true,
          genre: true,
          master: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  // Проверяем срок действия
  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: 'Invitation expired', status: 'expired' }, { status: 410 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used', status: invitation.status }, { status: 410 });
  }

  return NextResponse.json({
    id: invitation.id,
    company: invitation.company,
    message: invitation.message,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
  });
}

// POST - Принять или отклонить приглашение
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { inviteCode: params.code },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.expiresAt && new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'expired' },
    });
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
  }

  try {
    const body = await req.json();
    const { action } = body; // 'accept' или 'decline'

    if (action === 'accept') {
      // Проверяем, не является ли уже участником
      const existingMember = await prisma.companyPlayer.findUnique({
        where: {
          companyId_userId: {
            companyId: invitation.companyId,
            userId: session.user.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      }

      // Добавляем в компанию и обновляем приглашение
      await prisma.$transaction([
        prisma.companyPlayer.create({
          data: {
            companyId: invitation.companyId,
            userId: session.user.id,
          },
        }),
        prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            invitedUserId: session.user.id,
            respondedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({ success: true, status: 'accepted', companyId: invitation.companyId });
    } else if (action === 'decline') {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'declined',
          invitedUserId: session.user.id,
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, status: 'declined' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Invitation response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
