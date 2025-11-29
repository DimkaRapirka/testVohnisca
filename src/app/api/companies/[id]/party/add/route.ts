import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addToPartySchema = z.object({
  characterId: z.string(),
});

// POST - Добавить персонажа/NPC в партию (только мастер)
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

  // Только мастер может добавлять в партию
  if (company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can add to party' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { characterId } = addToPartySchema.parse(body);

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Проверяем что персонаж принадлежит мастеру или это NPC кампании
    const isOwnCharacter = character.userId === session.user.id;
    const isCompanyNpc = character.companyId === params.id && character.characterType === 'npc';

    if (!isOwnCharacter && !isCompanyNpc) {
      return NextResponse.json({ error: 'Cannot add this character' }, { status: 403 });
    }

    // Привязываем персонажа к кампании и делаем активным
    await prisma.character.update({
      where: { id: characterId },
      data: {
        companyId: params.id,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, characterId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Add to party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
