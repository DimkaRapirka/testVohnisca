'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CharacterCard } from '@/components/character-card';
import { CharacterEditor } from '@/components/character-editor';
import { Scroll, Plus, Users, User, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'player' | 'npc' | 'companion';

export default function CharactersPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<any>(null);

  const { data: characters, isLoading } = useQuery({
    queryKey: ['my-characters', filter],
    queryFn: async () => {
      const typeParam = filter !== 'all' ? `&type=${filter}` : '';
      const res = await fetch(`/api/characters?${typeParam}`);
      if (!res.ok) throw new Error('Failed to fetch characters');
      return res.json();
    },
  });

  const filterOptions: { value: FilterType; label: string; icon: any }[] = [
    { value: 'all', label: 'Все', icon: Users },
    { value: 'player', label: 'Игровые', icon: User },
    { value: 'npc', label: 'NPC', icon: Sparkles },
    { value: 'companion', label: 'Спутники', icon: Users },
  ];

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-fantasy text-primary mb-2">Мои персонажи</h1>
            <p className="text-gray-400">Управляйте своими героями и их развитием</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать персонажа
          </Button>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 mb-6">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(opt.value)}
            >
              <opt.icon className="h-4 w-4 mr-1" />
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Список персонажей */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">Загрузка персонажей...</p>
            </CardContent>
          </Card>
        ) : characters?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Scroll className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-fantasy text-primary mb-2">
                {filter === 'all' ? 'Нет персонажей' : `Нет персонажей типа "${filterOptions.find(f => f.value === filter)?.label}"`}
              </h3>
              <p className="text-gray-400 mb-4">
                Создайте своего первого персонажа для приключений
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать персонажа
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {characters?.map((char: any) => (
              <CharacterCard
                key={char.id}
                character={char}
                isOwner={true}
                onEdit={() => setEditingCharacter(char)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Создание персонажа */}
      <CharacterEditor
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Редактирование персонажа */}
      {editingCharacter && (
        <CharacterEditor
          open={!!editingCharacter}
          onOpenChange={(open) => !open && setEditingCharacter(null)}
          character={editingCharacter}
        />
      )}
    </div>
  );
}
