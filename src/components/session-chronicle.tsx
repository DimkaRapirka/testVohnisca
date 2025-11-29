'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { MasterOnly } from './master-only';
import { SessionEditor } from './session-editor';

interface SessionChronicleProps {
  companyId: string;
  isMaster: boolean;
}

export function SessionChronicle({ companyId, isMaster }: SessionChronicleProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-fantasy text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Хроника кампании
          </h2>
          <p className="text-gray-400 text-sm">История ваших приключений</p>
        </div>
        {isMaster && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить сессию
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-400">Загрузка хроники...</p>
          </CardContent>
        </Card>
      ) : sessions?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-fantasy text-primary mb-2">
              История еще не началась
            </h3>
            <p className="text-gray-400 mb-4">
              {isMaster
                ? 'Добавьте запись о первой сессии'
                : 'Мастер еще не добавил записи о сессиях'}
            </p>
            {isMaster && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить первую сессию
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions?.map((session: any) => (
            <SessionCard
              key={session.id}
              session={session}
              isMaster={isMaster}
              isExpanded={expandedSession === session.id}
              onToggle={() =>
                setExpandedSession(expandedSession === session.id ? null : session.id)
              }
              companyId={companyId}
            />
          ))}
        </div>
      )}

      {isMaster && (
        <SessionEditor
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          companyId={companyId}
        />
      )}
    </div>
  );
}

function SessionCard({
  session,
  isMaster,
  isExpanded,
  onToggle,
  companyId,
}: {
  session: any;
  isMaster: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  companyId: string;
}) {
  const router = useRouter();

  return (
    <Card
      className={`transition-all ${
        !session.isPublished && isMaster ? 'border-dashed border-gray-600 opacity-75' : ''
      }`}
    >
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm text-primary font-medium">
                Сессия #{session.sessionNumber}
              </span>
              {isMaster && !session.isPublished && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <EyeOff className="h-3 w-3" />
                  Скрыто
                </span>
              )}
            </div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
              {session.participants?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {session.participants.length} участников
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sessions/${session.id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Краткое содержание */}
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap line-clamp-4">{session.summary}</p>
          </div>

          {/* Детальные заметки мастера */}
          {isMaster && session.detailedNotes && (
            <MasterOnly isMaster={isMaster} className="mt-4" label="Заметки мастера">
              <p className="text-gray-400 whitespace-pre-wrap line-clamp-3">{session.detailedNotes}</p>
            </MasterOnly>
          )}

          {/* Участники */}
          {session.participants?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Участники сессии:</h4>
              <div className="flex flex-wrap gap-2">
                {session.participants.map((p: any) => (
                  <span
                    key={p.id}
                    className={`px-2 py-1 rounded text-sm ${
                      p.wasPresent
                        ? 'bg-primary/20 text-primary'
                        : 'bg-gray-700 text-gray-400 line-through'
                    }`}
                  >
                    {p.characterName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка подробнее */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/sessions/${session.id}`)}
            >
              Подробнее
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}


