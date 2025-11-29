import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const removeFromPartySchema = z.object({
  characterId: z.string(),
});

// POST - Удалить персонажа из партии (только мастер)
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

  // Только мастер может удалять из партии
  if (company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can remove from party' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { characterId } = removeFromPartySchema.parse(body);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    if (character.companyId !== params.id) {
      return NextResponse.json({ error: 'Character not in this company' }, { status: 400 });
    }

    // Деактивируем персонажа (не удаляем из кампании, просто делаем неактивным)
    // Для NPC - полностью отвязываем
    if (character.characterType === 'npc') {
      // NPC остаётся в кампании, просто становится неактивным
      await prisma.character.update({
        where: { id: characterId },
        data: { isActive: false },
      });
    } else {
      // Игровой персонаж - отвязываем от кампании
      await prisma.character.update({
        where: { id: characterId },
        data: {
          companyId: null,
          isActive: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Remove from party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
