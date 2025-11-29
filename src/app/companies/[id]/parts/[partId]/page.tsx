'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/role-badge';
import { VisibilityToggle } from '@/components/visibility-toggle';
import { MasterOnly, HiddenContentIndicator } from '@/components/master-only';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Plus,
  MapPin,
  Users,
  Swords,
  Package,
  ArrowLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { CreateLocationDialog } from '@/features/campaign/create-location-dialog';

export default function PartPage() {
  const { data: session } = useSession();
  const params = useParams();
  const companyId = params.id as string;
  const partId = params.partId as string;
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);

  // Получаем данные компании
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  // Получаем данные части
  const { data: parts, isLoading } = useQuery({
    queryKey: ['parts', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/parts`);
      if (!res.ok) throw new Error('Failed to fetch parts');
      return res.json();
    },
  });

  const part = parts?.find((p: any) => p.id === partId);
  const playerIds = company?.players?.map((p: any) => p.userId) || [];
  const { role, isMaster } = useUserRole(company?.masterId, playerIds);

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        {/* Навигация назад */}
        <Link href={`/companies/${companyId}/campaign`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к кампании
          </Button>
        </Link>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : !part ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Глава не найдена</p>
          </div>
        ) : (
          <>
            {/* Заголовок */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-fantasy text-primary">{part.name}</h1>
                  <RoleBadge role={role} />
                  {isMaster && <HiddenContentIndicator isPublished={part.isPublished} />}
                </div>
                {part.description && <p className="text-gray-400">{part.description}</p>}
              </div>

              <div className="flex items-center gap-2">
                {isMaster && (
                  <>
                    <VisibilityToggle
                      entityType="part"
                      entityId={part.id}
                      isPublished={part.isPublished}
                      invalidateKey={['parts', companyId]}
                    />
                    <Button onClick={() => setIsCreateLocationOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить локацию
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Публичный контент */}
            {part.publicContent && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <p className="text-gray-300 whitespace-pre-wrap">{part.publicContent}</p>
                </CardContent>
              </Card>
            )}

            {/* Секретный контент мастера */}
            <MasterOnly isMaster={isMaster} className="mb-8" label="Секреты главы">
              {part.masterContent ? (
                <p className="text-gray-300 whitespace-pre-wrap">{part.masterContent}</p>
              ) : (
                <p className="text-gray-500 italic">Секретные заметки не добавлены</p>
              )}
            </MasterOnly>

            {/* Локации */}
            <div className="mb-8">
              <h2 className="text-2xl font-fantasy text-primary mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Локации
              </h2>

              {part.locations?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-fantasy text-primary mb-2">Нет локаций</h3>
                    <p className="text-gray-400 mb-4">
                      {isMaster
                        ? 'Добавьте локации для этой главы'
                        : 'Мастер еще не открыл локации'}
                    </p>
                    {isMaster && (
                      <Button onClick={() => setIsCreateLocationOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить локацию
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {part.locations?.map((location: any) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      isMaster={isMaster}
                      companyId={companyId}
                      partId={partId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* События */}
            <div className="mb-8">
              <h2 className="text-2xl font-fantasy text-primary mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                События
              </h2>

              {part.events?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Нет событий</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {part.events?.map((event: any) => (
                    <EventCard key={event.id} event={event} isMaster={isMaster} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {part && (
        <CreateLocationDialog
          open={isCreateLocationOpen}
          onOpenChange={setIsCreateLocationOpen}
          partId={partId}
          companyId={companyId}
        />
      )}
    </div>
  );
}

// Карточка локации
function LocationCard({
  location,
  isMaster,
  companyId,
  partId,
}: {
  location: any;
  isMaster: boolean;
  companyId: string;
  partId: string;
}) {
  return (
    <Card
      className={`transition-all hover:border-primary/40 ${
        !location.isPublished && isMaster ? 'border-dashed border-gray-600 opacity-75' : ''
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              {isMaster && <HiddenContentIndicator isPublished={location.isPublished} />}
            </div>
            <CardTitle className="text-lg">{location.name}</CardTitle>
          </div>
          {isMaster && (
            <VisibilityToggle
              entityType="location"
              entityId={location.id}
              isPublished={location.isPublished}
              size="sm"
              showLabel={false}
              invalidateKey={['parts', companyId]}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {(location.publicDesc || location.description) && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {location.publicDesc || location.description}
          </p>
        )}

        {/* Статистика */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {location.npcs?.length || 0} NPC
          </span>
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" />
            {location.creatures?.length || 0} существ
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {location.lootItems?.length || 0} предметов
          </span>
        </div>

        <Link href={`/companies/${companyId}/parts/${partId}/locations/${location.id}`}>
          <Button variant="ghost" size="sm" className="w-full mt-4">
            Подробнее
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Карточка события
function EventCard({ event, isMaster }: { event: any; isMaster: boolean }) {
  const eventTypeLabels: Record<string, string> = {
    story: 'Сюжет',
    combat: 'Бой',
    social: 'Социальное',
    discovery: 'Открытие',
  };

  const eventTypeColors: Record<string, string> = {
    story: 'text-blue-400',
    combat: 'text-red-400',
    social: 'text-green-400',
    discovery: 'text-yellow-400',
  };

  return (
    <Card
      className={`${
        !event.isPublished && isMaster ? 'border-dashed border-gray-600 opacity-75' : ''
      } ${event.isCompleted ? 'opacity-60' : ''}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${eventTypeColors[event.eventType]}`}>
              {eventTypeLabels[event.eventType]}
            </span>
            <span className="text-white">{event.name}</span>
            {event.isCompleted && (
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                Завершено
              </span>
            )}
            {isMaster && <HiddenContentIndicator isPublished={event.isPublished} />}
          </div>
          {isMaster && (
            <VisibilityToggle
              entityType="event"
              entityId={event.id}
              isPublished={event.isPublished}
              size="sm"
              showLabel={false}
            />
          )}
        </div>
        {(event.publicDesc || event.description) && (
          <p className="text-gray-400 text-sm mt-2">
            {event.publicDesc || event.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
