import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Получить приглашения для текущего пользователя
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ищем приглашения по email или по userId
  const invitations = await prisma.invitation.findMany({
    where: {
      status: 'pending',
      OR: [
        { invitedEmail: session.user.email },
        { invitedUserId: session.user.id },
      ],
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          description: true,
          genre: true,
          master: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invitations);
}
