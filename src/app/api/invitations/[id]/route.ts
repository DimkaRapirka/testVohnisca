import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Получить информацию о приглашении по ID или коду
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      OR: [
        { id: params.id },
        { inviteCode: params.id },
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
