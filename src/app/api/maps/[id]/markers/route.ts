import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMarkerSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  masterNotes: z.string().optional(),
  posX: z.number().min(0).max(100),
  posY: z.number().min(0).max(100),
  markerType: z.enum(['location', 'city', 'dungeon', 'npc', 'region', 'custom']).default('location'),
  iconType: z.string().default('pin'),
  color: z.string().default('#e63946'),
  isPublished: z.boolean().default(false),
  linkedMapId: z.string().optional(),
  locationId: z.string().optional(),
  sessionId: z.string().optional(),
  npcId: z.string().optional(),
});

// POST - Создать метку на карте
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const map = await prisma.companyMap.findUnique({
    where: { id: params.id },
    include: { company: true },
  });

  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 404 });
  }

  if (map.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can create markers' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createMarkerSchema.parse(body);

    // Убираем пустые строки для linkedMapId
    const markerData = {
      ...data,
      mapId: params.id,
      linkedMapId: data.linkedMapId || null,
    };

    const marker = await prisma.mapMarker.create({
      data: markerData,
    });

    return NextResponse.json(marker);
  } catch (error) {
    console.error('Marker creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
