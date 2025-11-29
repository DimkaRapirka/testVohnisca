'use client';

import { Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/campaign';

interface RoleBadgeProps {
  role: UserRole | null;
  className?: string;
  showLabel?: boolean;
}

export function RoleBadge({ role, className, showLabel = true }: RoleBadgeProps) {
  if (!role) return null;

  const isMaster = role === 'master';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        isMaster
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'bg-fantasy-blue/20 text-blue-400 border border-blue-500/30',
        className
      )}
    >
      {isMaster ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {showLabel && <span>{isMaster ? 'Мастер' : 'Игрок'}</span>}
    </div>
  );
}
