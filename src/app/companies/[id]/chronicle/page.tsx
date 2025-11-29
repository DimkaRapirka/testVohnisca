'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { SessionChronicle } from '@/components/session-chronicle';
import { useUserRole } from '@/hooks/useUserRole';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChroniclePage() {
  const { data: session } = useSession();
  const params = useParams();
  const companyId = params.id as string;

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  const playerIds = company?.players?.map((p: any) => p.userId) || [];
  const { isMaster } = useUserRole(company?.masterId, playerIds);

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        <Link href={`/companies/${companyId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к кампании
          </Button>
        </Link>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-fantasy text-primary">{company?.name}</h1>
              <p className="text-gray-400">Хроника приключений</p>
            </div>

            <SessionChronicle companyId={companyId} isMaster={isMaster} />
          </>
        )}
      </main>
    </div>
  );
}
