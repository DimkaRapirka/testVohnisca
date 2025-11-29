'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  Clock,
  UserPlus,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface InvitationManagerProps {
  companyId: string;
  companyName: string;
}

export function InvitationManager({ companyId, companyName }: InvitationManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/invitations`);
      if (!res.ok) throw new Error('Failed to fetch invitations');
      return res.json();
    },
  });

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Ожидает', color: 'text-yellow-500', icon: Clock },
    accepted: { label: 'Принято', color: 'text-green-500', icon: CheckCircle },
    declined: { label: 'Отклонено', color: 'text-red-500', icon: XCircle },
    expired: { label: 'Истекло', color: 'text-gray-500', icon: X },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Приглашения
            </CardTitle>
            <CardDescription>Пригласите игроков в кампанию</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Пригласить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400 text-center py-4">Загрузка...</p>
        ) : invitations?.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Нет активных приглашений</p>
        ) : (
          <div className="space-y-3">
            {invitations?.map((inv: any) => {
              const status = statusLabels[inv.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${status.color}`} />
                    <div>
                      <div className="text-sm">
                        {inv.invitedEmail || 'Ссылка-приглашение'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(inv.createdAt)} • {status.label}
                      </div>
                    </div>
                  </div>
                  {inv.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(inv.inviteCode)}
                    >
                      {copiedCode === inv.inviteCode ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CreateInvitationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        companyId={companyId}
        companyName={companyName}
      />
    </Card>
  );
}

function CreateInvitationDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    expiresInDays: 7,
  });
  const [createdInvite, setCreatedInvite] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/companies/${companyId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invitation');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', companyId] });
      setCreatedInvite(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const copyLink = () => {
    if (createdInvite) {
      const link = `${window.location.origin}/invite/${createdInvite.inviteCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCreatedInvite(null);
    setFormData({ email: '', message: '', expiresInDays: 7 });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пригласить игрока</DialogTitle>
          <DialogDescription>
            Создайте приглашение в кампанию "{companyName}"
          </DialogDescription>
        </DialogHeader>

        {createdInvite ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-500 font-medium mb-2">Приглашение создано!</p>
              <p className="text-sm text-gray-400">
                Отправьте эту ссылку игроку:
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/invite/${createdInvite.inviteCode}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button onClick={handleClose} className="w-full">
              Готово
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email игрока (опционально)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="player@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Оставьте пустым для создания универсальной ссылки
              </p>
            </div>

            <div>
              <Label htmlFor="message">Сообщение (опционально)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Привет! Присоединяйся к нашей кампании..."
                rows={3}
              />
            </div>

            {createMutation.isError && (
              <p className="text-red-500 text-sm">{createMutation.error.message}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Создание...' : 'Создать приглашение'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
