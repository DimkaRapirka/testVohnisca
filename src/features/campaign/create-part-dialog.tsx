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
import { Lock, Eye } from 'lucide-react';

interface CreatePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CreatePartDialog({ open, onOpenChange, companyId }: CreatePartDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    publicContent: '',
    masterContent: '',
    isPublished: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/companies/${companyId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create part');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts', companyId] });
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        publicContent: '',
        masterContent: '',
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
          <DialogTitle>Создать новую главу</DialogTitle>
          <DialogDescription>
            Добавьте новую главу или раздел в вашу кампанию
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название главы *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Глава 1 - Начало пути"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Краткое описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание главы для навигации..."
                rows={2}
              />
            </div>
          </div>

          {/* Публичный контент */}
          <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-green-500" />
              <Label className="text-green-500">Публичный контент</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Этот текст увидят игроки, когда глава будет опубликована
            </p>
            <Textarea
              value={formData.publicContent}
              onChange={(e) => setFormData({ ...formData, publicContent: e.target.value })}
              placeholder="Описание для игроков: атмосфера, общая информация, что они видят и знают..."
              rows={4}
            />
          </div>

          {/* Секретный контент */}
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-primary" />
              <Label className="text-primary">Секретные заметки мастера</Label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Этот текст видите только вы. Сюрпризы, секреты, планы...
            </p>
            <Textarea
              value={formData.masterContent}
              onChange={(e) => setFormData({ ...formData, masterContent: e.target.value })}
              placeholder="Секреты главы: скрытые враги, тайные мотивы NPC, сюжетные повороты..."
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
                Если включено, игроки сразу увидят эту главу
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать главу'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
