'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionGallery } from '@/components/session-gallery';
import { MasterOnly } from '@/components/master-only';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Edit,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { SessionEditor } from '@/components/session-editor';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const sessionId = params.id as string;

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">Загрузка сессии...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-400">Сессия не найдена</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMaster = session.company?.masterId === authSession?.user?.id;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Навигация */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к кампании
        </Button>
        {isMaster && (
          <Button onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        )}
      </div>

      {/* Заголовок */}
      <Card>
        {session.coverImage && (
          <div className="h-48 overflow-hidden rounded-t-lg">
            <img
              src={session.coverImage}
              alt={session.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Сессия #{session.sessionNumber}
                </Badge>
                {!session.isPublished && (
                  <Badge variant="secondary" className="bg-gray-700">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Скрыто
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-fantasy">{session.title}</CardTitle>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(session.playedAt)}
                </span>
                {session.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.floor(session.duration / 60)}ч {session.duration % 60}м
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-6">
          {/* Краткое содержание */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Что произошло
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{session.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Заметки мастера */}
          {isMaster && session.detailedNotes && (
            <MasterOnly isMaster={isMaster} label="Заметки мастера">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-400 whitespace-pre-wrap">{session.detailedNotes}</p>
                </CardContent>
              </Card>
            </MasterOnly>
          )}

          {/* Локации */}
          {session.locations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Посещённые локации
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.locations.map((loc: any, index: number) => (
                    <div
                      key={loc.id}
                      className="flex gap-4 p-4 rounded-lg bg-background-tertiary"
                    >
                      {loc.imageUrl && (
                        <img
                          src={loc.imageUrl}
                          alt={loc.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-primary">{loc.name}</h4>
                        {loc.description && (
                          <p className="text-sm text-gray-400 mt-1">{loc.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Галерея */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Галерея</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionGallery sessionId={sessionId} canUpload={isMaster} />
            </CardContent>
          </Card>
        </div>

        {/* Сайдбар */}
        <div className="space-y-6">
          {/* Участники */}
          {session.participants?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Участники
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.participants.map((p: any) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded ${
                        p.wasPresent
                          ? 'bg-primary/10'
                          : 'bg-gray-800 opacity-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {p.characterName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <span className={p.wasPresent ? '' : 'line-through'}>
                          {p.characterName}
                        </span>
                      </div>
                      {!p.wasPresent && (
                        <span className="text-xs text-gray-500">Отсутствовал</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Заметки игроков */}
          {session.playerNotes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Заметки игроков</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.playerNotes.map((note: any) => (
                    <div key={note.id} className="p-3 rounded bg-background-tertiary">
                      <p className="text-sm text-gray-300">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Редактор */}
      {isMaster && (
        <SessionEditor
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          companyId={session.companyId}
          session={session}
        />
      )}
    </div>
  );
}
