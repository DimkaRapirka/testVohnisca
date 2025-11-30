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
import { MapPin, Eye, EyeOff, Lock } from 'lucide-react';
import { MarkerType, IconType } from '@/types/map';

interface MarkerEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: string;
  companyId: string;
  initialPosition?: { x: number; y: number };
  marker?: any; // Для редактирования
}

export function MarkerEditorDialog({
  open,
  onOpenChange,
  mapId,
  companyId,
  initialPosition,
  marker,
}: MarkerEditorDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!marker;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    masterNotes: '',
    posX: initialPosition?.x || 50,
    posY: initialPosition?.y || 50,
    markerType: 'location' as MarkerType,
    iconType: 'pin' as IconType,
    color: '#e63946',
    isPublished: false,
    linkedMapId: '',
  });

  // Загружаем все карты компании для связывания
  const { data: allMaps } = useQuery({
    queryKey: ['maps', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/maps`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  // Загружаем дочерние карты текущей карты
  const { data: currentMapData } = useQuery({
    queryKey: ['map', mapId],
    queryFn: async () => {
      const res = await fetch(`/api/maps/${mapId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open,
  });

  // Собираем все доступные карты для связывания (дочерние + все карты компании)
  const availableMaps = [
    ...(currentMapData?.childMaps || []),
    ...(allMaps || []).filter((m: any) => m.id !== mapId),
  ].filter((map, index, self) => 
    index === self.findIndex((m) => m.id === map.id)
  );

  useEffect(() => {
    if (open) {
      if (marker) {
        setFormData({
          name: marker.name || '',
          description: marker.description || '',
          masterNotes: marker.masterNotes || '',
          posX: marker.posX || 50,
          posY: marker.posY || 50,
          markerType: marker.markerType || 'location',
          iconType: marker.iconType || 'pin',
          color: marker.color || '#e63946',
          isPublished: marker.isPublished ?? false,
          linkedMapId: marker.linkedMapId || '',
        });
      } else if (initialPosition) {
        setFormData(prev => ({
          ...prev,
          posX: initialPosition.x,
          posY: initialPosition.y,
        }));
      }
    }
  }, [open, marker, initialPosition]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/maps/${mapId}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create marker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/markers/${marker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update marker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', mapId] });
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

  const markerTypes: { value: MarkerType; label: string }[] = [
    { value: 'location', label: 'Локация' },
    { value: 'city', label: 'Город' },
    { value: 'dungeon', label: 'Подземелье' },
    { value: 'npc', label: 'NPC' },
    { value: 'region', label: 'Регион' },
    { value: 'custom', label: 'Другое' },
  ];

  const iconTypes: { value: IconType; icon: string; label: string }[] = [
    { value: 'pin', icon: '📍', label: 'Метка' },
    { value: 'castle', icon: '🏰', label: 'Замок' },
    { value: 'village', icon: '🏘️', label: 'Деревня' },
    { value: 'cave', icon: '🕳️', label: 'Пещера' },
    { value: 'portal', icon: '🌀', label: 'Портал' },
    { value: 'mountain', icon: '⛰️', label: 'Гора' },
    { value: 'forest', icon: '🌲', label: 'Лес' },
    { value: 'water', icon: '💧', label: 'Вода' },
  ];

  const colors = [
    '#e63946', '#f77f00', '#fcbf49', '#06d6a0', '#118ab2',
    '#073b4c', '#8338ec', '#ff006e', '#fb5607', '#3a86ff',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isEditing ? 'Редактировать метку' : 'Создать метку'}
          </DialogTitle>
          <DialogDescription>
            Добавьте метку на карту с описанием и связями
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название места"
                required
              />
            </div>

            <div>
              <Label htmlFor="markerType">Тип метки</Label>
              <select
                id="markerType"
                value={formData.markerType}
                onChange={(e) => setFormData({ ...formData, markerType: e.target.value as MarkerType })}
                className="w-full px-3 py-2 rounded-md bg-background-secondary border border-gray-700 text-sm"
              >
                {markerTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Иконка</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {iconTypes.map(icon => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, iconType: icon.value })}
                  className={`p-2 rounded-lg border-2 transition-colors ${
                    formData.iconType === icon.value
                      ? 'border-primary bg-primary/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  title={icon.label}
                >
                  <span className="text-2xl">{icon.icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Цвет метки</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === color
                      ? 'border-white scale-110'
                      : 'border-gray-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Описание (видно игрокам)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Что игроки знают об этом месте..."
              rows={3}
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-primary" />
              <Label htmlFor="masterNotes" className="text-primary">Заметки мастера</Label>
            </div>
            <Textarea
              id="masterNotes"
              value={formData.masterNotes}
              onChange={(e) => setFormData({ ...formData, masterNotes: e.target.value })}
              placeholder="Секретная информация, ловушки, сюрпризы..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="linkedMapId">Связанная карта (опционально)</Label>
            <select
              id="linkedMapId"
              value={formData.linkedMapId}
              onChange={(e) => setFormData({ ...formData, linkedMapId: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-background-secondary border border-gray-700 text-sm"
            >
              <option value="">Нет связи</option>
              {availableMaps?.map((map: any) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              При клике на метку откроется выбранная карта.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded"
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
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать метку'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
