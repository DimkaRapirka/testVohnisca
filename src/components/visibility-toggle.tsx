'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface VisibilityToggleProps {
  entityType: 'part' | 'location' | 'npc' | 'creature' | 'loot' | 'event' | 'wiki';
  entityId: string;
  isPublished: boolean;
  onToggle?: (newState: boolean) => void;
  size?: 'sm' | 'default';
  showLabel?: boolean;
  invalidateKey?: string[];
}

export function VisibilityToggle({
  entityType,
  entityId,
  isPublished,
  onToggle,
  size = 'default',
  showLabel = true,
  invalidateKey,
}: VisibilityToggleProps) {
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState(isPublished);

  const toggleMutation = useMutation({
    mutationFn: async (newState: boolean) => {
      const res = await fetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          isPublished: newState,
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle visibility');
      return res.json();
    },
    onMutate: async (newState) => {
      setOptimisticState(newState);
    },
    onSuccess: (_, newState) => {
      onToggle?.(newState);
      if (invalidateKey) {
        queryClient.invalidateQueries({ queryKey: invalidateKey });
      }
    },
    onError: () => {
      setOptimisticState(isPublished);
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(!optimisticState);
  };

  const Icon = optimisticState ? Eye : EyeOff;
  const label = optimisticState ? 'Видно игрокам' : 'Скрыто';

  return (
    <Button
      variant={optimisticState ? 'default' : 'outline'}
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={handleToggle}
      disabled={toggleMutation.isPending}
      className={cn(
        'gap-2',
        optimisticState
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'border-gray-600 text-gray-400 hover:text-white'
      )}
    >
      {toggleMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
