'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { CreateNoteDialog } from '@/features/notes/create-note-dialog';
import { NoteCard } from '@/features/notes/note-card';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EncounterPage() {
  const { data: session } = useSession();
  const params = useParams();
  const encounterId = params.id as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');

  const { data: encounter, isLoading } = useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: async () => {
      const res = await fetch(`/api/encounters/${encounterId}`);
      if (!res.ok) throw new Error('Failed to fetch encounter');
      return res.json();
    },
  });

  const isMaster = encounter?.company?.masterId === session?.user?.id;

  const filteredNotes = encounter?.notes?.filter((note: any) => {
    if (privacyFilter === 'all') return true;
    return note.privacy === privacyFilter;
  });

  const encounterTypeLabels: Record<string, string> = {
    COMBAT: 'Бой',
    SOCIAL: 'Социальное взаимодействие',
    EXPLORATION: 'Исследование',
    MIXED: 'Смешанный',
  };

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link href={`/companies/${encounter.companyId}`}>
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к компании
                </Button>
              </Link>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-4xl font-fantasy text-primary mb-2">{encounter.name}</h1>
                  <p className="text-gray-400">{encounterTypeLabels[encounter.type]}</p>
                </div>
              </div>

              {encounter.description && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <p className="text-gray-300">{encounter.description}</p>
                  </CardContent>
                </Card>
              )}

              {encounter.detailedDesc && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Детальное описание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 whitespace-pre-wrap">{encounter.detailedDesc}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-fantasy text-primary">Заметки</h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все заметки</SelectItem>
                        <SelectItem value="PUBLIC">Публичные</SelectItem>
                        <SelectItem value="PRIVATE_AUTHOR">Мои приватные</SelectItem>
                        {isMaster && <SelectItem value="PRIVATE_MASTER">Для мастера</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить заметку
                </Button>
              </div>

              {filteredNotes?.length === 0 ? (
                <div className="text-center py-12 border border-primary/20 rounded-lg bg-background-secondary">
                  <p className="text-gray-400 mb-4">Нет заметок</p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить первую заметку
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotes?.map((note: any) => (
                    <NoteCard key={note.id} note={note} isMaster={isMaster} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {encounter && (
        <CreateNoteDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          encounterId={encounterId}
          isMaster={isMaster}
        />
      )}
    </div>
  );
}
