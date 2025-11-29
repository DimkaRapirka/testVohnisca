'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CharacterEditor } from '@/components/character-editor';
import {
  ArrowLeft,
  Edit,
  Heart,
  Shield,
  Coins,
  Star,
  Plus,
  Scroll,
  User,
  Swords,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');

  const characterId = params.id as string;

  const { data: character, isLoading, error } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const res = await fetch(`/api/characters/${characterId}`);
      if (!res.ok) throw new Error('Failed to fetch character');
      return res.json();
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/characters/${characterId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to add milestone');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', characterId] });
      setMilestoneTitle('');
      setIsAddMilestoneOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar user={authSession?.user} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">Загрузка персонажа...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen">
        <Navbar user={authSession?.user} />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-400">Персонаж не найден</p>
              <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isOwner = character.userId === authSession?.user?.id;
  const isMaster = character.company?.masterId === authSession?.user?.id;
  const canEdit = isOwner || isMaster;

  const hpPercent = character.maxHp > 0 ? (character.hp / character.maxHp) * 100 : 0;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar user={authSession?.user} />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Навигация */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          {canEdit && (
            <Button onClick={() => setIsEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>

        {/* Заголовок */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Аватар */}
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
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
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-fantasy text-primary">{character.name}</h1>
                  <Badge
                    variant="secondary"
                    className={cn(
                      character.characterType === 'player'
                        ? 'bg-blue-500/20 text-blue-400'
                        : character.characterType === 'npc'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-green-500/20 text-green-400'
                    )}
                  >
                    {character.characterType === 'player'
                      ? 'Игрок'
                      : character.characterType === 'npc'
                      ? 'NPC'
                      : 'Спутник'}
                  </Badge>
                </div>
                <p className="text-gray-400 text-lg">
                  {character.race} {character.class} • Уровень {character.level}
                  {character.background && ` • ${character.background}`}
                </p>
                {character.quote && (
                  <p className="text-primary italic mt-2">"{character.quote}"</p>
                )}
                {character.company && (
                  <p className="text-sm text-gray-500 mt-2">
                    Кампания: {character.company.name}
                  </p>
                )}
              </div>

              {/* Основные статы */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Heart className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold">{character.hp}/{character.maxHp}</div>
                  <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div className={cn('h-full', hpColor)} style={{ width: `${hpPercent}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">HP</p>
                </div>
                <div className="text-center">
                  <Shield className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{character.ac}</div>
                  <p className="text-xs text-gray-500 mt-1">AC</p>
                </div>
                <div className="text-center">
                  <Coins className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-500">{character.gold}</div>
                  <p className="text-xs text-gray-500 mt-1">Золото</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-6">
            {/* Характеристики */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  Характеристики
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  {[
                    { key: 'strength', label: 'СИЛ', full: 'Сила' },
                    { key: 'dexterity', label: 'ЛОВ', full: 'Ловкость' },
                    { key: 'constitution', label: 'ТЕЛ', full: 'Телосложение' },
                    { key: 'intelligence', label: 'ИНТ', full: 'Интеллект' },
                    { key: 'wisdom', label: 'МДР', full: 'Мудрость' },
                    { key: 'charisma', label: 'ХАР', full: 'Харизма' },
                  ].map((stat) => (
                    <div key={stat.key} className="text-center p-4 rounded-lg bg-background-tertiary">
                      <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold">{character[stat.key]}</div>
                      <div className="text-sm text-primary">{getModifier(character[stat.key])}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* История */}
            {(character.backstory || character.personality || character.ideals || character.bonds || character.flaws) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scroll className="h-5 w-5 text-primary" />
                    История персонажа
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {character.backstory && (
                    <div>
                      <h4 className="font-medium text-primary mb-1">Предыстория</h4>
                      <p className="text-gray-300 whitespace-pre-wrap">{character.backstory}</p>
                    </div>
                  )}
                  {character.personality && (
                    <div>
                      <h4 className="font-medium text-primary mb-1">Черты характера</h4>
                      <p className="text-gray-300">{character.personality}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {character.ideals && (
                      <div>
                        <h4 className="font-medium text-primary mb-1">Идеалы</h4>
                        <p className="text-gray-300">{character.ideals}</p>
                      </div>
                    )}
                    {character.bonds && (
                      <div>
                        <h4 className="font-medium text-primary mb-1">Привязанности</h4>
                        <p className="text-gray-300">{character.bonds}</p>
                      </div>
                    )}
                  </div>
                  {character.flaws && (
                    <div>
                      <h4 className="font-medium text-primary mb-1">Слабости</h4>
                      <p className="text-gray-300">{character.flaws}</p>
                    </div>
                  )}
                  {character.appearance && (
                    <div>
                      <h4 className="font-medium text-primary mb-1">Внешность</h4>
                      <p className="text-gray-300">{character.appearance}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Правая колонка */}
          <div className="space-y-6">
            {/* Достижения */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Достижения
                  </CardTitle>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setIsAddMilestoneOpen(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAddMilestoneOpen && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="Название достижения..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && milestoneTitle) {
                          addMilestoneMutation.mutate(milestoneTitle);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => milestoneTitle && addMilestoneMutation.mutate(milestoneTitle)}
                      disabled={!milestoneTitle || addMilestoneMutation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {character.milestones?.length > 0 ? (
                  <div className="space-y-2">
                    {character.milestones.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 p-2 rounded bg-background-tertiary">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="flex-1">{m.title}</span>
                        {m.sessionNumber && (
                          <span className="text-xs text-gray-500">#{m.sessionNumber}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Нет достижений</p>
                )}
              </CardContent>
            </Card>

            {/* Инвентарь */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Инвентарь ({character.inventory?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {character.inventory?.length > 0 ? (
                  <div className="space-y-2">
                    {character.inventory.map((item: any) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center justify-between p-2 rounded',
                          item.isEquipped ? 'bg-primary/20' : 'bg-background-tertiary'
                        )}
                      >
                        <span>{item.name}</span>
                        <span className="text-sm text-gray-400">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Инвентарь пуст</p>
                )}
              </CardContent>
            </Card>

            {/* Владелец */}
            {character.user && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">
                        {character.characterType === 'npc' ? 'Создан' : 'Игрок'}
                      </p>
                      <p className="font-medium">{character.user.name || character.user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Редактор */}
      {canEdit && (
        <CharacterEditor
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          character={character}
        />
      )}
    </div>
  );
}
