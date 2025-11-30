'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Check, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Загружаем приглашения
  const { data: invitations } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const res = await fetch('/api/invitations/my');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000, // Проверяем каждые 30 секунд
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'decline' }) => {
      const res = await fetch(`/api/invitations/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed to respond');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (data.companyId) {
        router.push(`/companies/${data.companyId}`);
      }
    },
  });

  const count = invitations?.length || 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {count}
          </span>
        )}
      </Button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          {/* Оверлей для закрытия */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Уведомления
                {count > 0 && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                    {count}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              {count === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Нет новых уведомлений
                </p>
              ) : (
                <div className="space-y-3">
                  {invitations?.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg bg-background-tertiary border border-primary/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Приглашение в кампанию
                          </p>
                          <p className="text-sm text-primary truncate">
                            {inv.company?.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            От: {inv.company?.master?.name || inv.company?.master?.email}
                          </p>
                          {inv.message && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              "{inv.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => respondMutation.mutate({ id: inv.id, action: 'accept' })}
                          disabled={respondMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Принять
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => respondMutation.mutate({ id: inv.id, action: 'decline' })}
                          disabled={respondMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
