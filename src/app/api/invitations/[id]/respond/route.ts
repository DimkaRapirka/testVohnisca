import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// POST - Принять или отклонить приглашение
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  // Проверяем что приглашение для этого пользователя
  const isForUser = 
    invitation.invitedEmail === session.user.email ||
    invitation.invitedUserId === session.user.id;

  if (!isForUser) {
    return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already responded' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action } = respondSchema.parse(body);

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
        // Уже участник, просто обновляем статус приглашения
        await prisma.invitation.update({
          where: { id: params.id },
          data: {
            status: 'accepted',
            respondedAt: new Date(),
            invitedUserId: session.user.id,
          },
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Вы уже являетесь участником этой кампании!',
          companyId: invitation.companyId,
        });
      }

      // Добавляем пользователя в компанию
      await prisma.$transaction([
        prisma.companyPlayer.create({
          data: {
            companyId: invitation.companyId,
            userId: session.user.id,
          },
        }),
        prisma.invitation.update({
          where: { id: params.id },
          data: {
            status: 'accepted',
            respondedAt: new Date(),
            invitedUserId: session.user.id,
          },
        }),
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Вы присоединились к кампании!',
        companyId: invitation.companyId,
      });
    } else {
      // Отклоняем приглашение
      await prisma.invitation.update({
        where: { id: params.id },
        data: {
          status: 'declined',
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Приглашение отклонено',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Invitation respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
