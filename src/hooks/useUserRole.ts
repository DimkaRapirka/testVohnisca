'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import type { UserRole } from '@/types/campaign';

interface UseUserRoleResult {
  role: UserRole | null;
  isMaster: boolean;
  isPlayer: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useUserRole(masterId?: string, playerIds?: string[]): UseUserRoleResult {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const userId = session?.user?.id || null;

  const result = useMemo(() => {
    if (!userId || !masterId) {
      return {
        role: null,
        isMaster: false,
        isPlayer: false,
      };
    }

    const isMaster = userId === masterId;
    const isPlayer = playerIds?.includes(userId) || false;

    return {
      role: (isMaster ? 'master' : isPlayer ? 'player' : null) as UserRole | null,
      isMaster,
      isPlayer,
    };
  }, [userId, masterId, playerIds]);

  return {
    ...result,
    isLoading,
    userId,
  };
}
