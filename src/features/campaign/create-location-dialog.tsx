'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Eye, MapPin } from 'lucide-react';

interface CreateLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  companyId: string;
}

export function CreateLocationDialog({
  open,
  onOpenChange,
  partId,
  companyId,
}: CreateLocationDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    publicDesc: '',
    masterNotes: '',
    imageUrl: '',
    mapUrl: '',
    isPublished: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/parts/${partId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create location');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts', companyId] });
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        publicDesc: '',
        masterNotes: '',
        imageUrl: '',
        mapUrl: '',
        isPublished: false,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Создать локацию
          </DialogTitle>
          <DialogDescription>
            Добавьте новую локацию в эту главу кампании
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название локации *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Таверна 'Золотой дракон'"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Общее описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание локации..."
                rows={2}
              />
            </div>
          </div>

          {/* Публичное описание */}
          <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-green-500" />
              <Label className="text-green-500">Публичное описание</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Что игроки видят и знают об этом месте
            </p>
            <Textarea
              value={formData.publicDesc}
              onChange={(e) => setFormData({ ...formData, publicDesc: e.target.value })}
              placeholder="Атмосфера, внешний вид, что бросается в глаза..."
              rows={4}
            />
          </div>

          {/* Секретные заметки */}
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <Label className="text-primary">Секретные заметки</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Скрытые детали, ловушки, секреты, планы...
            </p>
            <Textarea
              value={formData.masterNotes}
              onChange={(e) => setFormData({ ...formData, masterNotes: e.target.value })}
              placeholder="Тайные комнаты, скрытые NPC, ловушки, сюжетные зацепки..."
              rows={4}
            />
          </div>

          {/* Изображения */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageUrl">URL изображения</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="mapUrl">URL карты</Label>
              <Input
                id="mapUrl"
                value={formData.mapUrl}
                onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Публикация */}
          <div className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-background-secondary text-primary focus:ring-primary"
            />
            <div>
              <Label htmlFor="isPublished" className="cursor-pointer">
                Опубликовать сразу
              </Label>
              <p className="text-xs text-gray-400">
                Если включено, игроки сразу увидят эту локацию
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать локацию'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
