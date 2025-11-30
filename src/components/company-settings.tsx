'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
import { Settings, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any;
}

export function CompanySettings({ open, onOpenChange, company }: CompanySettingsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'danger'>('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    genre: company?.genre || '',
    partyLevel: company?.partyLevel || 1,
    allowPlayersAddCharacters: company?.allowPlayersAddCharacters ?? true,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', company.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      router.push('/companies');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deleteConfirmText === company.name) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Настройки кампании
          </DialogTitle>
          <DialogDescription>
            Управление настройками кампании "{company?.name}"
          </DialogDescription>
        </DialogHeader>

        {/* Табы */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          <Button
            type="button"
            variant={activeTab === 'general' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('general')}
          >
            Основное
          </Button>
          <Button
            type="button"
            variant={activeTab === 'danger' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('danger')}
            className={cn(activeTab === 'danger' && 'bg-red-500/20 text-red-400 hover:bg-red-500/30')}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Опасная зона
          </Button>
        </div>

        {/* Основные настройки */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Название кампании *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название кампании"
                required
              />
            </div>

            <div>
              <Label htmlFor="genre">Жанр/Сеттинг</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="Например: Фэнтези, Киберпанк, Хоррор"
              />
            </div>

            <div>
              <Label htmlFor="partyLevel">Уровень партии</Label>
              <Input
                id="partyLevel"
                type="number"
                min={1}
                max={20}
                value={formData.partyLevel}
                onChange={(e) => setFormData({ ...formData, partyLevel: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Средний уровень персонажей в партии
              </p>
            </div>

            <div>
              <Label htmlFor="description">Описание кампании</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание вашей кампании..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3 p-4 border border-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="allowPlayersAddCharacters"
                checked={formData.allowPlayersAddCharacters}
                onChange={(e) => setFormData({ ...formData, allowPlayersAddCharacters: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <div className="flex-1">
                <Label htmlFor="allowPlayersAddCharacters" className="cursor-pointer">
                  Разрешить игрокам добавлять персонажей
                </Label>
                <p className="text-xs text-gray-400 mt-1">
                  Игроки смогут добавлять своих персонажей в партию без одобрения мастера
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        )}

        {/* Опасная зона */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-400 mb-2">Удаление кампании</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Это действие необратимо. Будут удалены:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1 mb-4 list-disc list-inside">
                    <li>Все сессии и их записи</li>
                    <li>Все энкаунтеры</li>
                    <li>Все приглашения</li>
                    <li>История чата</li>
                    <li>Связи персонажей с кампанией</li>
                  </ul>

                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить кампанию
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-400 font-medium">
                        Введите название кампании для подтверждения:
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={company.name}
                        className="border-red-500/50"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleteConfirmText !== company.name || deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Удаление...' : 'Подтверждаю удаление'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
