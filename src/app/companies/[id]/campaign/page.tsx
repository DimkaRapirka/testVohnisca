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
  BookOpen,
  MapPin,
  Users,
  Scroll,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { CreatePartDialog } from '@/features/campaign/create-part-dialog';

export default function CampaignPage() {
  const { data: session } = useSession();
  const params = useParams();
  const companyId = params.id as string;
  const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);

  // Получаем данные компании
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  // Получаем части кампании
  const { data: parts, isLoading: partsLoading } = useQuery({
    queryKey: ['parts', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/parts`);
      if (!res.ok) throw new Error('Failed to fetch parts');
      return res.json();
    },
    enabled: !!company,
  });

  const playerIds = company?.players?.map((p: any) => p.userId) || [];
  const { role, isMaster, isPlayer } = useUserRole(company?.masterId, playerIds);

  const isLoading = companyLoading || partsLoading;

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Заголовок с индикатором роли */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-fantasy text-primary">{company.name}</h1>
                  <RoleBadge role={role} />
                </div>
                <p className="text-gray-400">
                  {company.genre && `${company.genre} • `}
                  Уровень партии: {company.partyLevel}
                </p>
              </div>

              {isMaster && (
                <Button onClick={() => setIsCreatePartOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить главу
                </Button>
              )}
            </div>

            {/* Описание компании */}
            {company.description && (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <p className="text-gray-300">{company.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Секретное описание (только для мастера) */}
            <MasterOnly isMaster={isMaster} className="mb-8" label="Секретные заметки мастера">
              {company.extendedDesc ? (
                <p className="text-gray-300">{company.extendedDesc}</p>
              ) : (
                <p className="text-gray-500 italic">
                  Здесь можно добавить секретные заметки, которые видит только мастер
                </p>
              )}
            </MasterOnly>

            {/* Части кампании */}
            <div className="mb-8">
              <h2 className="text-2xl font-fantasy text-primary mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Главы кампании
              </h2>

              {parts?.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-fantasy text-primary mb-2">
                      {isMaster ? 'Начните создавать историю' : 'История еще не началась'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {isMaster
                        ? 'Добавьте первую главу кампании'
                        : 'Мастер еще не открыл ни одной главы'}
                    </p>
                    {isMaster && (
                      <Button onClick={() => setIsCreatePartOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать первую главу
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {parts?.map((part: any, index: number) => (
                    <PartCard
                      key={part.id}
                      part={part}
                      index={index + 1}
                      isMaster={isMaster}
                      companyId={companyId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Быстрые ссылки */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href={`/companies/${companyId}/wiki`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scroll className="h-5 w-5 text-primary" />
                      Вики
                    </CardTitle>
                    <CardDescription>Лор, фракции, мифология</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href={`/companies/${companyId}/characters`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Персонажи
                    </CardTitle>
                    <CardDescription>Герои партии</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href={`/companies/${companyId}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Обзор
                    </CardTitle>
                    <CardDescription>Общая информация</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </>
        )}
      </main>

      {company && (
        <CreatePartDialog
          open={isCreatePartOpen}
          onOpenChange={setIsCreatePartOpen}
          companyId={companyId}
        />
      )}
    </div>
  );
}

// Компонент карточки части
function PartCard({
  part,
  index,
  isMaster,
  companyId,
}: {
  part: any;
  index: number;
  isMaster: boolean;
  companyId: string;
}) {
  return (
    <Card
      className={`transition-all ${
        !part.isPublished && isMaster ? 'border-dashed border-gray-600 opacity-75' : ''
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm text-primary font-medium">Глава {index}</span>
              {isMaster && <HiddenContentIndicator isPublished={part.isPublished} />}
            </div>
            <CardTitle className="text-xl">{part.name}</CardTitle>
            {part.description && (
              <CardDescription className="mt-2">{part.description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isMaster && (
              <VisibilityToggle
                entityType="part"
                entityId={part.id}
                isPublished={part.isPublished}
                size="sm"
                invalidateKey={['parts', companyId]}
              />
            )}
            <Link href={`/companies/${companyId}/parts/${part.id}`}>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Публичный контент */}
        {part.publicContent && (
          <p className="text-gray-300 text-sm mb-4">{part.publicContent}</p>
        )}

        {/* Секретный контент (только для мастера) */}
        {isMaster && part.masterContent && (
          <MasterOnly isMaster={isMaster} showBorder={true} label="Секреты главы">
            <p className="text-gray-400 text-sm">{part.masterContent}</p>
          </MasterOnly>
        )}

        {/* Статистика */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {part.locations?.length || 0} локаций
          </span>
          <span className="flex items-center gap-1">
            <Scroll className="h-4 w-4" />
            {part.events?.length || 0} событий
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
