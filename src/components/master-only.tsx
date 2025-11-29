'use client';

import { Lock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasterOnlyProps {
  children: React.ReactNode;
  isMaster: boolean;
  className?: string;
  showBorder?: boolean;
  label?: string;
}

/**
 * Компонент для отображения контента только мастеру
 * Игроки не видят этот контент вообще
 */
export function MasterOnly({
  children,
  isMaster,
  className,
  showBorder = true,
  label = 'Только для мастера',
}: MasterOnlyProps) {
  if (!isMaster) return null;

  return (
    <div
      className={cn(
        'relative',
        showBorder && 'border border-dashed border-primary/30 rounded-lg p-4 bg-primary/5',
        className
      )}
    >
      {showBorder && (
        <div className="absolute -top-3 left-3 px-2 bg-background-secondary">
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Lock className="h-3 w-3" />
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

interface HiddenContentIndicatorProps {
  isPublished: boolean;
  className?: string;
}

/**
 * Индикатор скрытого контента
 */
export function HiddenContentIndicator({ isPublished, className }: HiddenContentIndicatorProps) {
  if (isPublished) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-400',
        className
      )}
    >
      <Eye className="h-3 w-3" />
      <span>Скрыто от игроков</span>
    </div>
  );
}
