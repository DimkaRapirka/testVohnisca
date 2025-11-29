'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Lock, Eye, Users, Shield } from 'lucide-react';

interface NoteCardProps {
  note: any;
  isMaster: boolean;
}

export function NoteCard({ note, isMaster }: NoteCardProps) {
  const privacyIcons: Record<string, React.ReactNode> = {
    PUBLIC: <Users className="h-4 w-4 text-green-500" />,
    PRIVATE_AUTHOR: <Lock className="h-4 w-4 text-red-500" />,
    PRIVATE_MASTER: <Shield className="h-4 w-4 text-primary" />,
    VISIBLE_TO_SUBSET: <Eye className="h-4 w-4 text-blue-500" />,
  };

  const privacyLabels: Record<string, string> = {
    PUBLIC: 'Публичная',
    PRIVATE_AUTHOR: 'Приватная',
    PRIVATE_MASTER: 'Для мастера',
    VISIBLE_TO_SUBSET: 'Ограниченный доступ',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {note.title && <CardTitle className="text-lg mb-1">{note.title}</CardTitle>}
            <CardDescription className="flex items-center gap-2">
              <span>{note.author?.name || note.author?.email}</span>
              <span>•</span>
              <span>{formatDate(note.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {privacyIcons[note.privacy]}
                {privacyLabels[note.privacy]}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
      </CardContent>
    </Card>
  );
}
