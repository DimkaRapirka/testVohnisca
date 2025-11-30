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
import { ImageUpload } from '@/components/image-upload';
import { Lock, Eye, MapPin } from 'lucide-react';

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
}

export function LocationDialog({ open, onOpenChange, partId }: LocationDialogProps) {
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
      queryClient.invalidateQueries({ queryKey: ['locations', partId] });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="description">Краткое описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание локации..."
                rows={2}
              />
            </div>
          </div>

          {/* Изображение локации */}
          <ImageUpload
            label="Изображение локации"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            placeholder="URL изображения или загрузите с компьютера/телефона"
          />

          {/* Карта локации */}
          <ImageUpload
            label="Карта локации (опционально)"
            value={formData.mapUrl}
            onChange={(url) => setFormData({ ...formData, mapUrl: url })}
            placeholder="URL карты или загрузите с компьютера/телефона"
          />

          {/* Публичное описание */}
          <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-green-500" />
              <Label className="text-green-500">Публичное описание</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Что видят и знают игроки о этой локации
            </p>
            <Textarea
              value={formData.publicDesc}
              onChange={(e) => setFormData({ ...formData, publicDesc: e.target.value })}
              placeholder="Описание для игроков: атмосфера, что они видят..."
              rows={4}
            />
          </div>

          {/* Заметки мастера */}
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <Label className="text-primary">Заметки мастера</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Секретная информация, ловушки, скрытые проходы...
            </p>
            <Textarea
              value={formData.masterNotes}
              onChange={(e) => setFormData({ ...formData, masterNotes: e.target.value })}
              placeholder="Секреты локации: ловушки, скрытые комнаты, тайные враги..."
              rows={4}
            />
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
