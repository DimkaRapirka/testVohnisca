// Утилиты для фильтрации контента по ролям
// Вся логика приватности обрабатывается на сервере

import type { UserRole, ViewContext } from '@/types/campaign';

/**
 * Проверяет, является ли пользователь мастером компании
 */
export function isMaster(userId: string, masterId: string): boolean {
  return userId === masterId;
}

/**
 * Фильтрует Part для игрока (убирает скрытый контент)
 */
export function filterPartForPlayer<T extends { isPublished: boolean; masterContent?: string | null }>(
  part: T
): Omit<T, 'masterContent'> | null {
  if (!part.isPublished) return null;
  
  const { masterContent, ...publicPart } = part;
  return publicPart;
}

/**
 * Фильтрует Location для игрока
 */
export function filterLocationForPlayer<T extends { isPublished: boolean; masterNotes?: string | null }>(
  location: T
): Omit<T, 'masterNotes'> | null {
  if (!location.isPublished) return null;
  
  const { masterNotes, ...publicLocation } = location;
  return publicLocation;
}

/**
 * Фильтрует NPC для игрока
 */
export function filterNpcForPlayer<T extends { isPublished: boolean; masterNotes?: string | null }>(
  npc: T
): Omit<T, 'masterNotes'> | null {
  if (!npc.isPublished) return null;
  
  const { masterNotes, ...publicNpc } = npc;
  return publicNpc;
}

/**
 * Фильтрует массив элементов для игрока
 */
export function filterArrayForPlayer<T extends { isPublished: boolean }>(
  items: T[],
  filterFn: (item: T) => Omit<T, 'masterNotes' | 'masterContent'> | null
): Array<Omit<T, 'masterNotes' | 'masterContent'>> {
  return items
    .filter(item => item.isPublished)
    .map(filterFn)
    .filter((item): item is Omit<T, 'masterNotes' | 'masterContent'> => item !== null);
}

/**
 * Фильтрует WikiEntry для игрока
 */
export function filterWikiForPlayer<T extends { isPublished: boolean; masterContent?: string | null }>(
  entry: T
): Omit<T, 'masterContent'> | null {
  if (!entry.isPublished) return null;
  
  const { masterContent, ...publicEntry } = entry;
  return publicEntry;
}

/**
 * Определяет роль пользователя в компании
 */
export function getUserRole(
  userId: string,
  masterId: string,
  playerIds: string[]
): UserRole | null {
  if (userId === masterId) return 'master';
  if (playerIds.includes(userId)) return 'player';
  return null;
}

/**
 * Создает контекст просмотра
 */
export function createViewContext(
  userId: string,
  masterId: string,
  playerIds: string[],
  companyId: string
): ViewContext | null {
  const role = getUserRole(userId, masterId, playerIds);
  if (!role) return null;
  
  return {
    userId,
    role,
    companyId,
  };
}

/**
 * Проверяет доступ к компании
 */
export function hasCompanyAccess(
  userId: string,
  masterId: string,
  playerIds: string[]
): boolean {
  return userId === masterId || playerIds.includes(userId);
}
