'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  MapPin,
  Image,
  Plus,
  X,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  session?: any; // Для редактирования
}

export function SessionEditor({ open, onOpenChange, companyId, session }: SessionEditorProps) {
  const queryClient = useQueryClient();
  const isEditing = !!session;

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    detailedNotes: '',
    playedAt: new Date().toISOString().split('T')[0],
    duration: '',
    isPublished: true,
    coverImage: '',
  });

  const [participants, setParticipants] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'participants' | 'locations'>('main');

  // Загружаем персонажей кампании для выбора участников
  const { data: partyData } = useQuery({
    queryKey: ['party', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/party`);
      if (!res.ok) throw new Error('Failed to fetch party');
      return res.json();
    },
    enabled: open,
  });

  // Инициализация при редактировании
  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        summary: session.summary || '',
        detailedNotes: session.detailedNotes || '',
        playedAt: session.playedAt ? new Date(session.playedAt).toISOString().split('T')[0] : '',
        duration: session.duration?.toString() || '',
        isPublished: session.isPublished ?? true,
        coverImage: session.coverImage || '',
      });
      setParticipants(session.participants || []);
      setLocations(session.locations || []);
    } else {
      // Автозаполнение участников из партии
      if (partyData?.party) {
        setParticipants(
          partyData.party.map((char: any) => ({
            characterId: char.id,
            characterName: char.name,
            wasPresent: true,
            notes: '',
          }))
        );
      }
    }
  }, [session, partyData, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/companies/${companyId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      onOpenChange(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['session', session.id] });
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      detailedNotes: '',
      playedAt: new Date().toISOString().split('T')[0],
      duration: '',
      isPublished: true,
      coverImage: '',
    });
    setParticipants([]);
    setLocations([]);
    setActiveTab('main');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      participants: participants.filter(p => p.characterName),
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleParticipant = (characterId: string, characterName: string) => {
    const existing = participants.find(p => p.characterId === characterId);
    if (existing) {
      setParticipants(participants.map(p =>
        p.characterId === characterId ? { ...p, wasPresent: !p.wasPresent } : p
      ));
    } else {
      setParticipants([...participants, { characterId, characterName, wasPresent: true, notes: '' }]);
    }
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', description: '', imageUrl: '' }]);
  };

  const updateLocation = (index: number, field: string, value: string) => {
    setLocations(locations.map((loc, i) =>
      i === index ? { ...loc, [field]: value } : loc
    ));
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isEditing ? 'Редактировать сессию' : 'Новая сессия'}
          </DialogTitle>
          <DialogDescription>
            Запишите события игровой сессии для хроники кампании
          </DialogDescription>
        </DialogHeader>

        {/* Табы */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {[
            { id: 'main', label: 'Основное', icon: BookOpen },
            { id: 'participants', label: 'Участники', icon: Users },
            { id: 'locations', label: 'Локации', icon: MapPin },
          ].map(tab => (
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
          {/* Основная информация */}
          {activeTab === 'main' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Название сессии *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Осада форта Крагмор"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="playedAt">Дата игры</Label>
                  <Input
                    id="playedAt"
                    type="date"
                    value={formData.playedAt}
                    onChange={(e) => setFormData({ ...formData, playedAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Длительность (мин)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="180"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Краткое содержание *</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Что произошло в этой сессии..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="detailedNotes">Заметки мастера (скрыты)</Label>
                <Textarea
                  id="detailedNotes"
                  value={formData.detailedNotes}
                  onChange={(e) => setFormData({ ...formData, detailedNotes: e.target.value })}
                  placeholder="Детали для себя..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="coverImage">URL обложки</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="isPublished" className="cursor-pointer flex items-center gap-2">
                  {formData.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {formData.isPublished ? 'Видно игрокам' : 'Скрыто от игроков'}
                </Label>
              </div>
            </div>
          )}

          {/* Участники */}
          {activeTab === 'participants' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Отметьте персонажей, которые участвовали в сессии
              </p>

              {partyData?.party?.length > 0 ? (
                <div className="space-y-2">
                  {partyData.party.map((char: any) => {
                    const participant = participants.find(p => p.characterId === char.id);
                    const isPresent = participant?.wasPresent ?? false;

                    return (
                      <div
                        key={char.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                          isPresent ? 'bg-primary/20 border border-primary/40' : 'bg-background-tertiary'
                        )}
                        onClick={() => toggleParticipant(char.id, char.name)}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center',
                          isPresent ? 'bg-primary text-black' : 'bg-gray-600'
                        )}>
                          {isPresent && <Check className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{char.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            {char.race} {char.class}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {char.player?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  В кампании пока нет персонажей
                </p>
              )}
            </div>
          )}

          {/* Локации */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Добавьте локации, которые посетили в этой сессии
              </p>

              {locations.map((loc, index) => (
                <div key={index} className="p-4 rounded-lg bg-background-tertiary space-y-3">
                  <div className="flex justify-between items-start">
                    <Label>Локация #{index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={loc.name}
                    onChange={(e) => updateLocation(index, 'name', e.target.value)}
                    placeholder="Название локации"
                  />
                  <Textarea
                    value={loc.description}
                    onChange={(e) => updateLocation(index, 'description', e.target.value)}
                    placeholder="Что там произошло..."
                    rows={2}
                  />
                  <Input
                    value={loc.imageUrl}
                    onChange={(e) => updateLocation(index, 'imageUrl', e.target.value)}
                    placeholder="URL изображения (опционально)"
                  />
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addLocation} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить локацию
              </Button>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать сессию'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
