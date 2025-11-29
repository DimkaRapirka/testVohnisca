'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AvatarUpload } from './image-upload';
import { Eye, EyeOff, User } from 'lucide-react';

interface NpcEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  npc?: any; // Для редактирования существующего
}

export function NpcEditor({ open, onOpenChange, companyId, npc }: NpcEditorProps) {
  const queryClient = useQueryClient();
  const isEditing = !!npc;

  const [formData, setFormData] = useState({
    name: npc?.name || '',
    class: npc?.class || 'NPC',
    race: npc?.race || '',
    level: npc?.level || 1,
    background: npc?.background || '',
    avatarUrl: npc?.avatarUrl || '',
    backstory: npc?.backstory || '',
    personality: npc?.personality || '',
    appearance: npc?.appearance || '',
    quote: npc?.quote || '',
    maxHp: npc?.maxHp || 10,
    hp: npc?.hp || 10,
    ac: npc?.ac || 10,
    strength: npc?.strength || 10,
    dexterity: npc?.dexterity || 10,
    constitution: npc?.constitution || 10,
    intelligence: npc?.intelligence || 10,
    wisdom: npc?.wisdom || 10,
    charisma: npc?.charisma || 10,
    notes: npc?.notes || '',
    isPublic: npc?.isPublic ?? false,
  });

  const [showStats, setShowStats] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing
        ? `/api/characters/${npc.id}`
        : `/api/companies/${companyId}/npcs`;
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save NPC');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['npcs', companyId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            {isEditing ? 'Редактировать NPC' : 'Создать NPC'}
          </DialogTitle>
          <DialogDescription>
            NPC персонаж для вашей кампании. Вы можете скрыть его от игроков.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Аватар и основная информация */}
          <div className="flex gap-4">
            <AvatarUpload
              value={formData.avatarUrl}
              onChange={(url) => updateField('avatarUrl', url)}
              size="lg"
            />
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="name">Имя *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Гэндальф Серый"
                  required
                />
              </div>
              <div>
                <Label htmlFor="class">Роль / Класс</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => updateField('class', e.target.value)}
                  placeholder="Торговец, Маг, Воин..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="race">Раса</Label>
              <Input
                id="race"
                value={formData.race}
                onChange={(e) => updateField('race', e.target.value)}
                placeholder="Человек"
              />
            </div>
            <div>
              <Label htmlFor="level">Уровень</Label>
              <Input
                id="level"
                type="number"
                min={1}
                max={30}
                value={formData.level}
                onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="background">Происхождение</Label>
              <Input
                id="background"
                value={formData.background}
                onChange={(e) => updateField('background', e.target.value)}
                placeholder="Отшельник"
              />
            </div>
          </div>

          {/* Цитата */}
          <div>
            <Label htmlFor="quote">Характерная фраза</Label>
            <Input
              id="quote"
              value={formData.quote}
              onChange={(e) => updateField('quote', e.target.value)}
              placeholder="Ты не пройдёшь!"
            />
          </div>

          {/* Описание */}
          <div>
            <Label htmlFor="personality">Характер и поведение</Label>
            <Textarea
              id="personality"
              value={formData.personality}
              onChange={(e) => updateField('personality', e.target.value)}
              placeholder="Как NPC ведёт себя, его манеры, привычки..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="appearance">Внешность</Label>
            <Textarea
              id="appearance"
              value={formData.appearance}
              onChange={(e) => updateField('appearance', e.target.value)}
              placeholder="Как выглядит NPC..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="backstory">Предыстория (скрыта от игроков)</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => updateField('backstory', e.target.value)}
              placeholder="Секретная информация о NPC..."
              rows={3}
            />
          </div>

          {/* Характеристики */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="mb-2"
            >
              {showStats ? 'Скрыть характеристики' : 'Показать характеристики'}
            </Button>

            {showStats && (
              <div className="space-y-4 p-4 rounded-lg bg-background-tertiary">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>HP</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={formData.hp}
                        onChange={(e) => updateField('hp', parseInt(e.target.value) || 0)}
                        placeholder="Текущие"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={formData.maxHp}
                        onChange={(e) => updateField('maxHp', parseInt(e.target.value) || 1)}
                        placeholder="Макс"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ac">AC</Label>
                    <Input
                      id="ac"
                      type="number"
                      min={0}
                      value={formData.ac}
                      onChange={(e) => updateField('ac', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((stat) => (
                    <div key={stat}>
                      <Label className="text-xs">{stat.slice(0, 3).toUpperCase()}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={formData[stat as keyof typeof formData]}
                        onChange={(e) => updateField(stat, parseInt(e.target.value) || 10)}
                        className="text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Заметки мастера */}
          <div>
            <Label htmlFor="notes">Заметки мастера</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Личные заметки..."
              rows={2}
            />
          </div>

          {/* Видимость */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background-tertiary">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => updateField('isPublic', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="isPublic" className="cursor-pointer flex items-center gap-2">
              {formData.isPublic ? (
                <>
                  <Eye className="h-4 w-4 text-green-400" />
                  Виден игрокам
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 text-gray-400" />
                  Скрыт от игроков
                </>
              )}
            </Label>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать NPC'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
