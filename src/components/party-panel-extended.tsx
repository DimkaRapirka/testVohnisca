'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Heart,
  Shield,
  Package,
  Coins,
  Users,
  Minus,
  Plus,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharacterCard } from './character-card';

interface PartyPanelExtendedProps {
  companyId: string;
  isMaster: boolean;
}

export function PartyPanelExtended({ companyId, isMaster }: PartyPanelExtendedProps) {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['party', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/party`);
      if (!res.ok) throw new Error('Failed to fetch party');
      return res.json();
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

  if (!data?.party?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Партия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            В кампании пока нет активных персонажей
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Партия ({data.characterCount} персонажей)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.party.map((char: any) => (
            <CharacterRow
              key={char.id}
              character={char}
              isMaster={isMaster}
              isExpanded={expandedCharacter === char.id}
              onToggle={() => setExpandedCharacter(
                expandedCharacter === char.id ? null : char.id
              )}
              companyId={companyId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterRow({
  character,
  isMaster,
  isExpanded,
  onToggle,
  companyId,
}: {
  character: any;
  isMaster: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  companyId: string;
}) {
  const [isEditingHp, setIsEditingHp] = useState(false);
  const [hpValue, setHpValue] = useState(character.hp);
  const queryClient = useQueryClient();

  const hpPercent = (character.hp / character.maxHp) * 100;
  const hpColor =
    hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const quickUpdateMutation = useMutation({
    mutationFn: async (data: { hp?: number; gold?: number }) => {
      const res = await fetch(`/api/characters/${character.id}/quick-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party', companyId] });
    },
  });

  const adjustHp = (delta: number) => {
    const newHp = Math.max(0, Math.min(character.maxHp, character.hp + delta));
    quickUpdateMutation.mutate({ hp: newHp });
  };

  const saveHp = () => {
    const newHp = Math.max(0, Math.min(character.maxHp, hpValue));
    quickUpdateMutation.mutate({ hp: newHp });
    setIsEditingHp(false);
  };

  return (
    <div className="rounded-lg bg-background-tertiary overflow-hidden">
      {/* Основная строка */}
      <div
        className="flex items-center gap-4 p-3 cursor-pointer hover:bg-background-secondary transition-colors"
        onClick={onToggle}
      >
        {/* Аватар */}
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
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
            <span className="text-xs text-gray-400">
              {character.race} {character.class}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Игрок: {character.player?.name || 'Неизвестно'}
          </div>
        </div>

        {/* Уровень */}
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{character.level}</div>
          <div className="text-xs text-gray-500">Ур.</div>
        </div>

        {/* HP с быстрым редактированием */}
        <div className="w-28" onClick={(e) => e.stopPropagation()}>
          {isEditingHp ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={hpValue}
                onChange={(e) => setHpValue(parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-sm text-center"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveHp}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsEditingHp(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {isMaster && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => adjustHp(-1)}
                  disabled={quickUpdateMutation.isPending}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
              <div
                className={cn('flex-1 cursor-pointer', isMaster && 'hover:text-primary')}
                onClick={() => isMaster && setIsEditingHp(true)}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="h-3 w-3 text-red-400" />
                  <span className="text-sm">{character.hp}/{character.maxHp}</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className={cn('h-full transition-all', hpColor)} style={{ width: `${hpPercent}%` }} />
                </div>
              </div>
              {isMaster && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => adjustHp(1)}
                  disabled={quickUpdateMutation.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
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

        {/* Золото */}
        {isMaster && (
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            <Coins className="h-4 w-4" />
            <span>{character.gold}</span>
          </div>
        )}

        {/* Стрелка */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {/* Расширенная информация */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-700 space-y-3">
          {/* Характеристики */}
          <div className="grid grid-cols-6 gap-2 text-center">
            {[
              { label: 'СИЛ', value: character.strength },
              { label: 'ЛОВ', value: character.dexterity },
              { label: 'ТЕЛ', value: character.constitution },
              { label: 'ИНТ', value: character.intelligence },
              { label: 'МДР', value: character.wisdom },
              { label: 'ХАР', value: character.charisma },
            ].map((stat) => (
              <div key={stat.label} className="p-2 rounded bg-background-secondary">
                <div className="text-xs text-gray-500">{stat.label}</div>
                <div className="font-bold">{stat.value}</div>
                <div className="text-xs text-gray-400">
                  {stat.value >= 10 ? '+' : ''}{Math.floor((stat.value - 10) / 2)}
                </div>
              </div>
            ))}
          </div>

          {/* Достижения */}
          {character.milestones?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Star className="h-4 w-4" />
                Достижения
              </h4>
              <div className="flex flex-wrap gap-2">
                {character.milestones.map((m: any) => (
                  <span key={m.id} className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">
                    {m.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Цитата */}
          {character.quote && (
            <p className="text-sm italic text-primary">"{character.quote}"</p>
          )}
        </div>
      )}
    </div>
  );
}
