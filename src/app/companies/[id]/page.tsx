'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Scroll, Users, Settings, BookOpen, UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CreateEncounterDialog } from '@/features/encounters/create-encounter-dialog';
import { useSession } from 'next-auth/react';
import { PartyPanel } from '@/components/party-panel';
import { InvitationManager } from '@/components/invitation-manager';
import { RoleBadge } from '@/components/role-badge';
import { useUserRole } from '@/hooks/useUserRole';
import { NpcEditor } from '@/components/npc-editor';
import { NpcPanel } from '@/components/npc-panel';

export default function CompanyPage() {
  const { data: session } = useSession();
  const params = useParams();
  const companyId = params.id as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNpcEditorOpen, setIsNpcEditorOpen] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  const playerIds = company?.players?.map((p: any) => p.userId) || [];
  const { role, isMaster } = useUserRole(company?.masterId, playerIds);

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
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
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
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Настройки
                  </Button>
                )}
              </div>

              {company.description && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <p className="text-gray-300">{company.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Быстрые действия */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Link href={`/companies/${companyId}/campaign`}>
                  <Button size="lg">
                    <Scroll className="h-5 w-5 mr-2" />
                    Кампания
                  </Button>
                </Link>
                <Link href={`/companies/${companyId}/chronicle`}>
                  <Button size="lg" variant="outline">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Хроника
                  </Button>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Мастер</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{company.master?.name || company.master?.email}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Игроки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-gray-300">{company.players?.length || 0} игроков</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Панель партии */}
              <div className="mb-6">
                <PartyPanel companyId={companyId} isMaster={isMaster} />
              </div>

              {/* NPC мастера */}
              {isMaster && (
                <div className="mb-6">
                  <NpcPanel companyId={companyId} onCreateNpc={() => setIsNpcEditorOpen(true)} />
                </div>
              )}

              {/* Приглашения (только для мастера) */}
              {isMaster && (
                <div className="mb-6">
                  <InvitationManager companyId={companyId} companyName={company.name} />
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-fantasy text-primary">Энкаунтеры</h2>
                {isMaster && (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать энкаунтер
                  </Button>
                )}
              </div>

              {company.encounters?.length === 0 ? (
                <div className="text-center py-12 border border-primary/20 rounded-lg bg-background-secondary">
                  <Scroll className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-fantasy text-primary mb-2">Нет энкаунтеров</h3>
                  <p className="text-gray-400 mb-6">Создайте первый энкаунтер для этой кампании</p>
                  {isMaster && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать энкаунтер
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {company.encounters?.map((encounter: any) => (
                    <Link key={encounter.id} href={`/encounters/${encounter.id}`}>
                      <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle className="text-lg">{encounter.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {encounter.type.toLowerCase().replace('_', ' ')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {encounter.description || 'Без описания'}
                          </p>
                          <div className="mt-3 text-sm text-gray-500">
                            {encounter._count?.notes || 0} заметок
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {company && (
        <>
          <CreateEncounterDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            companyId={companyId}
          />
          {isMaster && (
            <NpcEditor
              open={isNpcEditorOpen}
              onOpenChange={setIsNpcEditorOpen}
              companyId={companyId}
            />
          )}
        </>
      )}
    </div>
  );
}
