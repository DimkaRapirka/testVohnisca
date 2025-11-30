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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  isMaster: boolean;
}

export function CreateNoteDialog({
  open,
  onOpenChange,
  encounterId,
  isMaster,
}: CreateNoteDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    privacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE_MASTER' | 'PRIVATE_AUTHOR' | 'VISIBLE_TO_SUBSET',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { encounterId: string }) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        console.error('Failed to create note:', error);
        throw new Error(error.error || 'Failed to create note');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounter', encounterId] });
      onOpenChange(false);
      setFormData({ title: '', content: '', privacy: 'PUBLIC' });
    },
    onError: (error) => {
      console.error('Create note error:', error);
      alert(`Ошибка создания заметки: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, encounterId });
  };

  const privacyLabels: Record<string, string> = {
    PUBLIC: 'Публичная (все видят)',
    PRIVATE_AUTHOR: 'Приватная (только я)',
    PRIVATE_MASTER: 'Для мастера (только мастера)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать заметку</DialogTitle>
          <DialogDescription>Добавьте новую заметку к этому энкаунтеру</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Заголовок (опционально)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Заголовок заметки..."
            />
          </div>

          <div>
            <Label htmlFor="content">Содержание *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Текст заметки..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="privacy">Приватность</Label>
            <Select
              value={formData.privacy}
              onValueChange={(value: any) => setFormData({ ...formData, privacy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{privacyLabels.PUBLIC}</SelectItem>
                <SelectItem value="PRIVATE_AUTHOR">{privacyLabels.PRIVATE_AUTHOR}</SelectItem>
                {isMaster && (
                  <SelectItem value="PRIVATE_MASTER">{privacyLabels.PRIVATE_MASTER}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {createMutation.isError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">
                Ошибка: {createMutation.error?.message || 'Не удалось создать заметку'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
