'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { ImageUpload } from './image-upload';
import { Map as MapIcon, Eye, EyeOff } from 'lucide-react';

interface MapEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  parentMapId?: string;
  map?: any; // Для редактирования
}

export function MapEditorDialog({
  open,
  onOpenChange,
  companyId,
  parentMapId,
  map,
}: MapEditorDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!map;

  // Загружаем участников компании
  const { data: companyData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
    enabled: open,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isPublished: false,
    visibleToPlayers: '',
  });

  useEffect(() => {
    if (open) {
      if (map) {
        setFormData({
          name: map.name || '',
          description: map.description || '',
          imageUrl: map.imageUrl || '',
          isPublished: map.isPublished ?? false,
          visibleToPlayers: map.visibleToPlayers || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          imageUrl: '',
          isPublished: false,
          visibleToPlayers: '',
        });
      }
    }
  }, [open, map]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/companies/${companyId}/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          parentMapId,
        }),
      });
      if (!res.ok) throw new Error('Failed to create map');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps', companyId] });
      if (parentMapId) {
        queryClient.invalidateQueries({ queryKey: ['map', parentMapId] });
      }
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/maps/${map.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update map');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps', companyId] });
      queryClient.invalidateQueries({ queryKey: ['map', map.id] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            {isEditing ? 'Редактировать карту' : 'Создать карту'}
          </DialogTitle>
          <DialogDescription>
            {parentMapId 
              ? 'Добавьте детальную карту региона'
              : 'Загрузите карту мира, региона или подземелья'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название карты *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Карта мира, Северное королевство"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание карты..."
              rows={3}
            />
          </div>

          <ImageUpload
            label="Изображение карты *"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            placeholder="Загрузите изображение карты"
          />

          <div className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-background-secondary text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <Label htmlFor="isPublished" className="cursor-pointer flex items-center gap-2">
                {formData.isPublished ? (
                  <Eye className="h-4 w-4 text-green-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                )}
                {formData.isPublished ? 'Видна игрокам' : 'Скрыта от игроков'}
              </Label>
              <p className="text-xs text-gray-400 mt-1">
                Игроки смогут видеть эту карту и её метки
              </p>
            </div>
          </div>

          {formData.isPublished && companyData?.players && (
            <div className="p-4 border border-gray-700 rounded-lg space-y-3">
              <Label>Видимость для участников (опционально)</Label>
              <p className="text-xs text-gray-400">
                Если не выбрано - карта видна всем участникам. Выберите конкретных участников для ограничения доступа.
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {companyData.players.map((player: any) => {
                  const isSelected = formData.visibleToPlayers.split(',').includes(player.userId);
                  return (
                    <div key={player.userId} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`player-${player.userId}`}
                        checked={isSelected}
                        onChange={(e) => {
                          const ids = formData.visibleToPlayers.split(',').filter(Boolean);
                          if (e.target.checked) {
                            ids.push(player.userId);
                          } else {
                            const index = ids.indexOf(player.userId);
                            if (index > -1) ids.splice(index, 1);
                          }
                          setFormData({ ...formData, visibleToPlayers: ids.join(',') });
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <Label htmlFor={`player-${player.userId}`} className="cursor-pointer text-sm">
                        {player.user?.name || player.user?.email}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !formData.imageUrl}>
              {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать карту'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
