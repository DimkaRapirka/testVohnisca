'use client';

import { useState, useEffect } from 'react';
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
import { User, Scroll, Sword, Heart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character?: any;
  companyId?: string;
}

export function CharacterEditor({ open, onOpenChange, character, companyId }: CharacterEditorProps) {
  const queryClient = useQueryClient();
  const isEditing = !!character;

  const [activeTab, setActiveTab] = useState<'basic' | 'stats' | 'story'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    race: '',
    level: 1,
    background: '',
    alignment: '',
    avatarUrl: '',
    
    // LongStoryShort
    backstory: '',
    personality: '',
    ideals: '',
    bonds: '',
    flaws: '',
    appearance: '',
    quote: '',
    
    // Характеристики
    maxHp: 10,
    hp: 10,
    ac: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    
    gold: 0,
    silver: 0,
    copper: 0,
    notes: '',
    characterType: 'player' as 'player' | 'npc' | 'companion',
    isPublic: true,
    companyId: companyId || '',
  });

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        class: character.class || '',
        race: character.race || '',
        level: character.level || 1,
        background: character.background || '',
        alignment: character.alignment || '',
        avatarUrl: character.avatarUrl || '',
        backstory: character.backstory || '',
        personality: character.personality || '',
        ideals: character.ideals || '',
        bonds: character.bonds || '',
        flaws: character.flaws || '',
        appearance: character.appearance || '',
        quote: character.quote || '',
        maxHp: character.maxHp || 10,
        hp: character.hp || 10,
        ac: character.ac || 10,
        strength: character.strength || 10,
        dexterity: character.dexterity || 10,
        constitution: character.constitution || 10,
        intelligence: character.intelligence || 10,
        wisdom: character.wisdom || 10,
        charisma: character.charisma || 10,
        gold: character.gold || 0,
        silver: character.silver || 0,
        copper: character.copper || 0,
        notes: character.notes || '',
        characterType: character.characterType || 'player',
        isPublic: character.isPublic ?? true,
        companyId: character.companyId || companyId || '',
      });
    }
  }, [character, companyId]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditing ? `/api/characters/${character.id}` : '/api/characters';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save character');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      if (formData.companyId) {
        queryClient.invalidateQueries({ queryKey: ['party', formData.companyId] });
      }
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      companyId: formData.companyId || undefined,
    };
    mutation.mutate(data);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'basic', label: 'Основное', icon: User },
    { id: 'stats', label: 'Характеристики', icon: Sword },
    { id: 'story', label: 'История', icon: Scroll },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEditing ? 'Редактировать персонажа' : 'Создать персонажа'}
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о вашем герое
          </DialogDescription>
        </DialogHeader>

        {/* Табы */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              type="button"
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Основное */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Артас Менетил"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="class">Класс *</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={(e) => updateField('class', e.target.value)}
                    placeholder="Паладин"
                    required
                  />
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
                    max={20}
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
                    placeholder="Благородный"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quote">Характерная фраза</Label>
                <Input
                  id="quote"
                  value={formData.quote}
                  onChange={(e) => updateField('quote', e.target.value)}
                  placeholder="Свет да защитит нас!"
                />
              </div>

              <div>
                <Label>Аватар персонажа</Label>
                <div className="flex items-center gap-4 mt-2">
                  <AvatarUpload
                    value={formData.avatarUrl}
                    onChange={(url) => updateField('avatarUrl', url)}
                  />
                  <div className="flex-1">
                    <Input
                      value={formData.avatarUrl}
                      onChange={(e) => updateField('avatarUrl', e.target.value)}
                      placeholder="Или вставьте URL..."
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Тип персонажа</Label>
                  <div className="flex gap-2 mt-1">
                    {['player', 'npc', 'companion'].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={formData.characterType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateField('characterType', type)}
                      >
                        {type === 'player' ? 'Игрок' : type === 'npc' ? 'NPC' : 'Спутник'}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => updateField('isPublic', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span>Виден другим игрокам</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Характеристики */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-400" />
                    HP
                  </Label>
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
                  <Label className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-blue-400" />
                    AC
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.ac}
                    onChange={(e) => updateField('ac', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Монеты */}
              <div>
                <Label className="mb-2 block">Монеты</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-yellow-500">Золото (зм)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.gold}
                      onChange={(e) => updateField('gold', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Серебро (см)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.silver}
                      onChange={(e) => updateField('silver', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-orange-600">Медь (мм)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.copper}
                      onChange={(e) => updateField('copper', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Характеристики</Label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { key: 'strength', label: 'СИЛ' },
                    { key: 'dexterity', label: 'ЛОВ' },
                    { key: 'constitution', label: 'ТЕЛ' },
                    { key: 'intelligence', label: 'ИНТ' },
                    { key: 'wisdom', label: 'МДР' },
                    { key: 'charisma', label: 'ХАР' },
                  ].map((stat) => (
                    <div key={stat.key} className="text-center">
                      <Label className="text-xs">{stat.label}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={formData[stat.key as keyof typeof formData] as number}
                        onChange={(e) => updateField(stat.key, parseInt(e.target.value) || 10)}
                        className="text-center"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {(formData[stat.key as keyof typeof formData] as number) >= 10 ? '+' : ''}
                        {Math.floor(((formData[stat.key as keyof typeof formData] as number) - 10) / 2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* История */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="backstory">Предыстория</Label>
                <Textarea
                  id="backstory"
                  value={formData.backstory}
                  onChange={(e) => updateField('backstory', e.target.value)}
                  placeholder="История вашего персонажа до начала приключений..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="personality">Черты характера</Label>
                <Textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => updateField('personality', e.target.value)}
                  placeholder="Как ваш персонаж ведёт себя..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ideals">Идеалы</Label>
                  <Textarea
                    id="ideals"
                    value={formData.ideals}
                    onChange={(e) => updateField('ideals', e.target.value)}
                    placeholder="Во что верит..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="bonds">Привязанности</Label>
                  <Textarea
                    id="bonds"
                    value={formData.bonds}
                    onChange={(e) => updateField('bonds', e.target.value)}
                    placeholder="Что важно..."
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="flaws">Слабости</Label>
                <Textarea
                  id="flaws"
                  value={formData.flaws}
                  onChange={(e) => updateField('flaws', e.target.value)}
                  placeholder="Недостатки персонажа..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="appearance">Внешность</Label>
                <Textarea
                  id="appearance"
                  value={formData.appearance}
                  onChange={(e) => updateField('appearance', e.target.value)}
                  placeholder="Как выглядит ваш персонаж..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Личные заметки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Заметки для себя..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
