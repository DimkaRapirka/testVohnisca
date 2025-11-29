'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, Plus, Eye, EyeOff, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NpcEditor } from './npc-editor';

interface NpcPanelProps {
  companyId: string;
  onCreateNpc: () => void;
}

export function NpcPanel({ companyId, onCreateNpc }: NpcPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingNpc, setEditingNpc] = useState<any>(null);

  const { data: npcs, isLoading } = useQuery({
    queryKey: ['npcs', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/npcs`);
      if (!res.ok) throw new Error('Failed to fetch NPCs');
      return res.json();
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              NPC мастера ({npcs?.length || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCreateNpc}>
                <Plus className="h-4 w-4 mr-1" />
                Создать NPC
              </Button>
              {npcs?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent>
            <p className="text-gray-400 text-center py-4">Загрузка NPC...</p>
          </CardContent>
        ) : npcs?.length === 0 ? (
          <CardContent>
            <div className="text-center py-6">
              <Sparkles className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-3">У вас пока нет NPC</p>
              <p className="text-sm text-gray-500 mb-4">
                Создайте персонажей для вашей кампании: торговцев, врагов, союзников
              </p>
              <Button onClick={onCreateNpc}>
                <Plus className="h-4 w-4 mr-2" />
                Создать первого NPC
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            {/* Компактный вид */}
            {!isExpanded && (
              <div className="flex flex-wrap gap-2">
                {npcs?.slice(0, 6).map((npc: any) => (
                  <NpcBadge key={npc.id} npc={npc} onClick={() => setEditingNpc(npc)} />
                ))}
                {npcs?.length > 6 && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setIsExpanded(true)}>
                    +{npcs.length - 6} ещё
                  </Badge>
                )}
              </div>
            )}

            {/* Расширенный вид */}
            {isExpanded && (
              <div className="space-y-2">
                {npcs?.map((npc: any) => (
                  <NpcRow key={npc.id} npc={npc} onEdit={() => setEditingNpc(npc)} />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Редактор NPC */}
      {editingNpc && (
        <NpcEditor
          open={!!editingNpc}
          onOpenChange={(open) => !open && setEditingNpc(null)}
          companyId={companyId}
          npc={editingNpc}
        />
      )}
    </>
  );
}

function NpcBadge({ npc, onClick }: { npc: any; onClick: () => void }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-colors',
        npc.isPublic
          ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      )}
      onClick={onClick}
    >
      <span className="text-sm font-medium">{npc.name}</span>
      {!npc.isPublic && <EyeOff className="h-3 w-3" />}
    </div>
  );
}

function NpcRow({ npc, onEdit }: { npc: any; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors">
      {/* Аватар */}
      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
        {npc.avatarUrl ? (
          <img
            src={npc.avatarUrl}
            alt={npc.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          npc.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{npc.name}</span>
          {npc.isPublic ? (
            <span title="Виден игрокам">
              <Eye className="h-3 w-3 text-green-400" />
            </span>
          ) : (
            <span title="Скрыт от игроков">
              <EyeOff className="h-3 w-3 text-gray-500" />
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 truncate">
          {npc.race && `${npc.race} `}{npc.class}
          {npc.quote && ` • "${npc.quote}"`}
        </p>
      </div>

      {/* Уровень */}
      <div className="text-center">
        <div className="text-sm font-bold text-purple-400">{npc.level}</div>
        <div className="text-xs text-gray-500">Ур.</div>
      </div>

      {/* Редактировать */}
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
}
