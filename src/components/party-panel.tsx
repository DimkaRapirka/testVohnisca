'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Heart,
  Shield,
  Package,
  Coins,
  Users,
  Swords,
  Plus,
  UserPlus,
  Sparkles,
  Crown,
  X,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharacterEditor } from './character-editor';

interface PartyPanelProps {
  companyId: string;
  isMaster: boolean;
}

export function PartyPanel({ companyId, isMaster }: PartyPanelProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['party', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/party`);
      if (!res.ok) throw new Error('Failed to fetch party');
      return res.json();
    },
  });

  // Загрузка полных данных персонажа для редактирования
  const { data: editingCharacter } = useQuery({
    queryKey: ['character', editingCharacterId],
    queryFn: async () => {
      const res = await fetch(`/api/characters/${editingCharacterId}`);
      if (!res.ok) throw new Error('Failed to fetch character');
      return res.json();
    },
    enabled: !!editingCharacterId,
  });

  // Удаление персонажа из партии (только мастер)
  const removeMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const res = await fetch(`/api/companies/${companyId}/party/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party', companyId] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-400">Загрузка партии...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Партия ({data?.party?.length || 0})
          </CardTitle>
          {isMaster && (
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data?.party?.length ? (
          <div className="text-center py-6">
            <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-3">В партии пока никого нет</p>
            {isMaster && (
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить персонажа
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.party.map((char: any) => (
              <CharacterRow
                key={char.id}
                character={char}
                isMaster={isMaster}
                onRemove={() => removeMutation.mutate(char.id)}
                onEdit={() => setEditingCharacterId(char.id)}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Диалог добавления */}
      {isMaster && (
        <AddToPartyDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          companyId={companyId}
        />
      )}

      {/* Редактор персонажа */}
      {editingCharacterId && editingCharacter && (
        <CharacterEditor
          open={!!editingCharacterId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCharacterId(null);
              queryClient.invalidateQueries({ queryKey: ['party', companyId] });
            }
          }}
          character={editingCharacter}
          companyId={companyId}
        />
      )}
    </Card>
  );
}

function CharacterRow({
  character,
  isMaster,
  onRemove,
  onEdit,
}: {
  character: any;
  isMaster: boolean;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const hpColor =
    hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const isNpc = character.characterType === 'npc';
  const isMasterChar = character.isMasterCharacter;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors group">
      {/* Аватар */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold',
          isNpc ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'
        )}
      >
        {character.avatarUrl ? (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          character.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{character.name}</span>
          {isNpc && (
            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
              NPC
            </Badge>
          )}
          {isMasterChar && (
            <Crown className="h-3 w-3 text-yellow-500" title="Персонаж мастера" />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {character.race} {character.class}
          {character.player && !isNpc && ` • ${character.player.name}`}
        </div>
      </div>

      {/* Уровень */}
      <div className="text-center">
        <div className="text-lg font-bold text-primary">{character.level}</div>
        <div className="text-xs text-gray-500">Ур.</div>
      </div>

      {/* HP */}
      <div className="w-24">
        <div className="flex items-center gap-1 mb-1">
          <Heart className="h-3 w-3 text-red-400" />
          <span className="text-sm">
            {character.hp}/{character.maxHp}
          </span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', hpColor)}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* AC */}
      <div className="flex items-center gap-1 text-sm">
        <Shield className="h-4 w-4 text-blue-400" />
        <span>{character.ac}</span>
      </div>

      {/* Инвентарь */}
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <Package className="h-4 w-4" />
        <span>{character.inventoryCount}</span>
      </div>

      {/* Золото (только для мастера) */}
      {isMaster && (
        <div className="flex items-center gap-1 text-xs">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-500">{character.gold || 0}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">{character.silver || 0}</span>
          <span className="text-gray-500">/</span>
          <span className="text-orange-600">{character.copper || 0}</span>
        </div>
      )}

      {/* Действия */}
      {isMaster && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Редактировать">
            <Edit className="h-4 w-4 text-gray-400 hover:text-primary" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove} title="Убрать из партии">
            <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Диалог добавления персонажа/NPC в партию
function AddToPartyDialog({
  open,
  onOpenChange,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}) {
  const [tab, setTab] = useState<'characters' | 'npcs'>('characters');
  const queryClient = useQueryClient();

  // Мои персонажи (мастера)
  const { data: myCharacters } = useQuery({
    queryKey: ['my-characters-for-party'],
    queryFn: async () => {
      const res = await fetch('/api/characters?type=player');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: open && tab === 'characters',
  });

  // NPC кампании
  const { data: npcs } = useQuery({
    queryKey: ['npcs', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/npcs`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: open && tab === 'npcs',
  });

  // Текущая партия для фильтрации
  const { data: partyData } = useQuery({
    queryKey: ['party', companyId],
    enabled: open,
  });

  const partyIds = partyData?.party?.map((c: any) => c.id) || [];

  // Добавление в партию
  const addMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const res = await fetch(`/api/companies/${companyId}/party/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party', companyId] });
    },
  });

  const availableCharacters = myCharacters?.filter(
    (c: any) => !partyIds.includes(c.id) && (!c.companyId || c.companyId === companyId)
  );

  const availableNpcs = npcs?.filter((n: any) => !partyIds.includes(n.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить в партию</DialogTitle>
        </DialogHeader>

        {/* Табы */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          <Button
            variant={tab === 'characters' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('characters')}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Мои персонажи
          </Button>
          <Button
            variant={tab === 'npcs' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('npcs')}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            NPC кампании
          </Button>
        </div>

        {/* Список персонажей */}
        {tab === 'characters' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableCharacters?.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Нет доступных персонажей
              </p>
            ) : (
              availableCharacters?.map((char: any) => (
                <AddCharacterRow
                  key={char.id}
                  character={char}
                  onAdd={() => addMutation.mutate(char.id)}
                  isAdding={addMutation.isPending}
                />
              ))
            )}
          </div>
        )}

        {/* Список NPC */}
        {tab === 'npcs' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableNpcs?.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Нет доступных NPC
              </p>
            ) : (
              availableNpcs?.map((npc: any) => (
                <AddCharacterRow
                  key={npc.id}
                  character={npc}
                  isNpc
                  onAdd={() => addMutation.mutate(npc.id)}
                  isAdding={addMutation.isPending}
                />
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddCharacterRow({
  character,
  isNpc = false,
  onAdd,
  isAdding,
}: {
  character: any;
  isNpc?: boolean;
  onAdd: () => void;
  isAdding: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold',
          isNpc ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'
        )}
      >
        {character.avatarUrl ? (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          character.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{character.name}</span>
          {isNpc && (
            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
              NPC
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-400">
          {character.race} {character.class} • Ур. {character.level}
        </p>
      </div>
      <Button size="sm" onClick={onAdd} disabled={isAdding}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Компактная версия для sidebar
export function PartyPanelCompact({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['party', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/party`);
      if (!res.ok) throw new Error('Failed to fetch party');
      return res.json();
    },
  });

  if (isLoading || !data?.party?.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <Swords className="h-4 w-4" />
        Партия
      </h4>
      <div className="space-y-1">
        {data.party.map((char: any) => {
          const hpPercent = (char.hp / char.maxHp) * 100;
          const isNpc = char.characterType === 'npc';
          return (
            <div
              key={char.id}
              className="flex items-center gap-2 text-sm p-2 rounded bg-background-tertiary"
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isNpc ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'
                )}
              >
                {char.name.charAt(0)}
              </div>
              <span className="flex-1 truncate">{char.name}</span>
              <span className="text-xs text-gray-500">Ур.{char.level}</span>
              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    hpPercent > 50
                      ? 'bg-green-500'
                      : hpPercent > 25
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
