import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasCompanyAccess } from '@/lib/privacy';

// GET - Получить всех персонажей в кампании (партию)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      players: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const playerIds = company.players.map((p) => p.userId);
  const hasAccess = hasCompanyAccess(session.user.id, company.masterId, playerIds);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Получаем всех активных персонажей в кампании (игроки + NPC)
  const characters = await prisma.character.findMany({
    where: {
      companyId: params.id,
      isActive: true,
      // Показываем игровых персонажей и NPC
      characterType: { in: ['player', 'npc', 'companion'] },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      inventory: {
        select: { id: true, name: true, quantity: true, isEquipped: true },
      },
      milestones: {
        orderBy: { date: 'desc' },
        take: 3,
      },
    },
    orderBy: [
      { characterType: 'asc' }, // Сначала игроки, потом NPC
      { name: 'asc' },
    ],
  });

  const isMaster = company.masterId === session.user.id;

  // Формируем данные партии
  const party = characters.map((char) => ({
    id: char.id,
    name: char.name,
    class: char.class,
    race: char.race,
    level: char.level,
    hp: char.hp,
    maxHp: char.maxHp,
    ac: char.ac,
    avatarUrl: char.avatarUrl,
    gold: char.gold,
    quote: char.quote,
    characterType: char.characterType,
    inventoryCount: char.inventory.length,
    equippedCount: char.inventory.filter((i) => i.isEquipped).length,
    milestones: char.milestones,
    isMasterCharacter: char.userId === company.masterId,
    player: char.characterType !== 'npc' ? {
      id: char.user.id,
      name: char.user.name || char.user.email,
      avatar: char.user.avatar,
    } : null,
    // Для мастера показываем больше информации
    ...(isMaster
      ? {
          strength: char.strength,
          dexterity: char.dexterity,
          constitution: char.constitution,
          intelligence: char.intelligence,
          wisdom: char.wisdom,
          charisma: char.charisma,
          inventory: char.inventory,
        }
      : {}),
  }));

  return NextResponse.json({
    party,
    playerCount: company.players.length,
    characterCount: characters.length,
  });
}

// POST - Установить активного персонажа для игрока в кампании
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { characterId } = body;

    // Проверяем, что пользователь - участник кампании
    const membership = await prisma.companyPlayer.findUnique({
      where: {
        companyId_userId: {
          companyId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this company' }, { status: 403 });
    }

    // Проверяем, что персонаж принадлежит пользователю
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character || character.userId !== session.user.id) {
      return NextResponse.json({ error: 'Character not found or not yours' }, { status: 404 });
    }

    // Привязываем персонажа к кампании и устанавливаем как активного
    await prisma.$transaction([
      // Обновляем персонажа
      prisma.character.update({
        where: { id: characterId },
        data: {
          companyId: params.id,
          isActive: true,
        },
      }),
      // Обновляем активного персонажа в membership
      prisma.companyPlayer.update({
        where: { id: membership.id },
        data: { activeCharacterId: characterId },
      }),
    ]);

    return NextResponse.json({ success: true, characterId });
  } catch (error) {
    console.error('Set active character error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
