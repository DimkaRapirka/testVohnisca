'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Users, Check, X, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function InvitePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', code],
    queryFn: async () => {
      const res = await fetch(`/api/invitations/${code}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Приглашение не найдено');
      }
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (action: 'accept' | 'decline') => {
      const res = await fetch(`/api/invitations/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'accepted') {
        router.push(`/companies/${data.companyId}`);
      }
    },
  });

  // Если не авторизован, показываем предложение войти
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-400">Загрузка приглашения...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-fantasy text-primary mb-2">
                  Приглашение недействительно
                </h2>
                <p className="text-gray-400 mb-6">{(error as Error).message}</p>
                <Link href="/">
                  <Button>На главную</Button>
                </Link>
              </CardContent>
            </Card>
          ) : !session ? (
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Flame className="h-12 w-12 text-accent-fire" />
                </div>
                <CardTitle className="text-2xl font-fantasy">
                  Приглашение в кампанию
                </CardTitle>
                <CardDescription>
                  Вас пригласили в "{invitation?.company?.name}"
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400 mb-6">
                  Войдите или зарегистрируйтесь, чтобы принять приглашение
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href={`/auth/signin?callbackUrl=/invite/${code}`}>
                    <Button variant="outline">Войти</Button>
                  </Link>
                  <Link href={`/auth/signup?callbackUrl=/invite/${code}`}>
                    <Button>Регистрация</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-fantasy">
                  {invitation?.company?.name}
                </CardTitle>
                <CardDescription>
                  {invitation?.company?.genre && `${invitation.company.genre} • `}
                  Мастер: {invitation?.company?.master?.name || invitation?.company?.master?.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitation?.company?.description && (
                  <p className="text-gray-300 text-center mb-6">
                    {invitation.company.description}
                  </p>
                )}

                {invitation?.message && (
                  <div className="p-4 rounded-lg bg-background-tertiary mb-6">
                    <p className="text-sm text-gray-400 mb-1">Сообщение от мастера:</p>
                    <p className="text-gray-300">{invitation.message}</p>
                  </div>
                )}

                {respondMutation.isError && (
                  <p className="text-red-500 text-center mb-4">
                    {respondMutation.error.message}
                  </p>
                )}

                {respondMutation.isSuccess && respondMutation.data.status === 'declined' ? (
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Приглашение отклонено</p>
                    <Link href="/">
                      <Button variant="outline">На главную</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => respondMutation.mutate('decline')}
                      disabled={respondMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Отклонить
                    </Button>
                    <Button
                      onClick={() => respondMutation.mutate('accept')}
                      disabled={respondMutation.isPending}
                    >
                      {respondMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Присоединиться
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
