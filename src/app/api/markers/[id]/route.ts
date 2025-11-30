import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMarkerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  masterNotes: z.string().optional(),
  posX: z.number().min(0).max(100).optional(),
  posY: z.number().min(0).max(100).optional(),
  markerType: z.enum(['location', 'city', 'dungeon', 'npc', 'region', 'custom']).optional(),
  iconType: z.string().optional(),
  color: z.string().optional(),
  isPublished: z.boolean().optional(),
  linkedMapId: z.string().optional(),
});

// PATCH - Обновить метку
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const marker = await prisma.mapMarker.findUnique({
    where: { id: params.id },
    include: { map: { include: { company: true } } },
  });

  if (!marker) {
    return NextResponse.json({ error: 'Marker not found' }, { status: 404 });
  }

  if (marker.map.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can edit markers' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateMarkerSchema.parse(body);

    const updated = await prisma.mapMarker.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Удалить метку
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const marker = await prisma.mapMarker.findUnique({
    where: { id: params.id },
    include: { map: { include: { company: true } } },
  });

  if (!marker) {
    return NextResponse.json({ error: 'Marker not found' }, { status: 404 });
  }

  if (marker.map.company.masterId !== session.user.id) {
    return NextResponse.json({ error: 'Only master can delete markers' }, { status: 403 });
  }

  await prisma.mapMarker.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
