'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Scroll } from 'lucide-react';
import Link from 'next/link';
import { CreateCompanyDialog } from '@/features/companies/create-company-dialog';
import { useSession } from 'next-auth/react';

export default function CompaniesPage() {
  const { data: session } = useSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch('/api/companies');
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-fantasy text-primary mb-2">Мои компании</h1>
            <p className="text-gray-400">Управляйте своими кампаниями и приключениями</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать компанию
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : companies?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-fantasy text-primary mb-2">Нет компаний</h3>
            <p className="text-gray-400 mb-6">Создайте свою первую кампанию</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать компанию
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies?.map((company: any) => (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{company.name}</CardTitle>
                    <CardDescription>
                      {company.genre && `${company.genre} • `}
                      Рівень {company.partyLevel}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {company.description || 'Без описания'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.players?.length || 0} игроков
                      </div>
                      <div className="flex items-center gap-1">
                        <Scroll className="h-4 w-4" />
                        {company._count?.encounters || 0} энкаунтеров
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <CreateCompanyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
