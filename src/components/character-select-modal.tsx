'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, Shield, Plus, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  currentCharacterId?: string;
  onCreateNew?: () => void;
}

export function CharacterSelectModal({
  open,
  onOpenChange,
  companyId,
  currentCharacterId,
  onCreateNew,
}: CharacterSelectModalProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(currentCharacterId || null);

  // Загружаем персонажей пользователя
  const { data: characters, isLoading } = useQuery({
    queryKey: ['my-characters'],
    queryFn: async () => {
      const res = await fetch('/api/characters?type=player');
      if (!res.ok) throw new Error('Failed to fetch characters');
      return res.json();
    },
    enabled: open,
  });

  // Мутация для выбора активного персонажа
  const selectMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const res = await fetch(`/api/companies/${companyId}/select-character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) throw new Error('Failed to select character');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      onOpenChange(false);
    },
  });

  const handleSelect = () => {
    if (selectedId) {
      selectMutation.mutate(selectedId);
    }
  };

  // Фильтруем персонажей: показываем тех, кто не привязан к другой кампании или уже в этой
  const availableCharacters = characters?.filter((char: any) =>
    !char.companyId || char.companyId === companyId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Выберите персонажа
          </DialogTitle>
          <DialogDescription>
            Выберите персонажа для участия в этой кампании
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400">Загрузка персонажей...</div>
        ) : availableCharacters?.length === 0 ? (
          <div className="py-8 text-center">
            <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">У вас пока нет персонажей</p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Создать персонажа
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {availableCharacters?.map((char: any) => (
              <CharacterOption
                key={char.id}
                character={char}
                isSelected={selectedId === char.id}
                isCurrent={currentCharacterId === char.id}
                onClick={() => setSelectedId(char.id)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          {onCreateNew && (
            <Button variant="outline" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Новый персонаж
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedId || selectMutation.isPending}
            >
              {selectMutation.isPending ? 'Выбор...' : 'Выбрать'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CharacterOption({
  character,
  isSelected,
  isCurrent,
  onClick,
}: {
  character: any;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const hpPercent = character.maxHp > 0 ? (character.hp / character.maxHp) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        isSelected ? 'border-primary bg-primary/10' : 'hover:border-gray-600',
        isCurrent && 'ring-2 ring-primary/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Аватар */}
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">{character.name}</span>
              {isCurrent && (
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                  Текущий
                </Badge>
              )}
              {character.companyId && character.companyId !== character.company?.id && (
                <Badge variant="secondary" className="text-xs">
                  В другой кампании
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {character.race} {character.class} • Уровень {character.level}
            </p>
          </div>

          {/* Статы */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-sm">
                <Heart className="h-4 w-4 text-red-400" />
                <span>{character.hp}/{character.maxHp}</span>
              </div>
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div className={cn('h-full', hpColor)} style={{ width: `${hpPercent}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Shield className="h-4 w-4 text-blue-400" />
              <span>{character.ac}</span>
            </div>
          </div>

          {/* Чекбокс */}
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            isSelected ? 'border-primary bg-primary' : 'border-gray-600'
          )}>
            {isSelected && <Check className="h-4 w-4 text-black" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
