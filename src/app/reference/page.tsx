'use client';

import { Navbar } from '@/components/navbar';
import { BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ReferencePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-fantasy text-primary mb-2">Справочник</h1>
          <p className="text-gray-400">Заклинания, существа и правила D&D</p>
        </div>

        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-fantasy text-primary mb-2">В разработке</h3>
          <p className="text-gray-400">Справочник будет доступен в следующей версии</p>
        </div>
      </main>
    </div>
  );
}
