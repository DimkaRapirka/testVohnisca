import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const selectCharacterSchema = z.object({
  characterId: z.string(),
});

// POST - Выбрать активного персонажа для кампании
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      players: { where: { userId: session.user.id } },
    },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Проверяем что пользователь - игрок или мастер
  const isPlayer = company.players.length > 0;
  const isMaster = company.masterId === session.user.id;

  if (!isPlayer && !isMaster) {
    return NextResponse.json({ error: 'Not a member of this company' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { characterId } = selectCharacterSchema.parse(body);

    // Проверяем что персонаж принадлежит пользователю
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    if (character.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not your character' }, { status: 403 });
    }

    // Проверяем что персонаж не в другой кампании
    if (character.companyId && character.companyId !== params.id) {
      return NextResponse.json({ error: 'Character is in another company' }, { status: 400 });
    }

    // Транзакция: привязываем персонажа к кампании и обновляем activeCharacterId
    await prisma.$transaction([
      // Привязываем персонажа к кампании
      prisma.character.update({
        where: { id: characterId },
        data: { companyId: params.id },
      }),
      // Обновляем активного персонажа в CompanyPlayer
      prisma.companyPlayer.updateMany({
        where: {
          companyId: params.id,
          userId: session.user.id,
        },
        data: { activeCharacterId: characterId },
      }),
    ]);

    return NextResponse.json({ success: true, characterId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Select character error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
