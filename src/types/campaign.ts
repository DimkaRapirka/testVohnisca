// Типы для системы приватности и ролей

export type UserRole = 'master' | 'player';

export type Visibility = 'hidden' | 'partial' | 'published';

export interface ViewContext {
  userId: string;
  role: UserRole;
  companyId: string;
}

// Part (Часть кампании)
export interface Part {
  id: string;
  name: string;
  description: string | null;
  masterContent: string | null;
  publicContent: string | null;
  order: number;
  isPublished: boolean;
  imageUrl: string | null;
  companyId: string;
  locations?: Location[];
  events?: Event[];
  createdAt: Date;
  updatedAt: Date;
}

// Версия для игрока (без скрытого контента)
export interface PartPlayerView {
  id: string;
  name: string;
  description: string | null;
  publicContent: string | null;
  order: number;
  imageUrl: string | null;
  locations?: LocationPlayerView[];
  events?: EventPlayerView[];
}

// Location (Локация)
export interface Location {
  id: string;
  name: string;
  description: string | null;
  masterNotes: string | null;
  publicDesc: string | null;
  imageUrl: string | null;
  mapUrl: string | null;
  isPublished: boolean;
  order: number;
  partId: string;
  npcs?: Npc[];
  creatures?: LocationCreature[];
  lootItems?: LootItem[];
  events?: Event[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationPlayerView {
  id: string;
  name: string;
  publicDesc: string | null;
  imageUrl: string | null;
  mapUrl: string | null;
  order: number;
  npcs?: NpcPlayerView[];
  events?: EventPlayerView[];
}

// NPC
export interface Npc {
  id: string;
  name: string;
  description: string | null;
  masterNotes: string | null;
  publicDesc: string | null;
  imageUrl: string | null;
  race: string | null;
  occupation: string | null;
  isPublished: boolean;
  isAlive: boolean;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NpcPlayerView {
  id: string;
  name: string;
  publicDesc: string | null;
  imageUrl: string | null;
  race: string | null;
  occupation: string | null;
  isAlive: boolean;
}

// Creature (Существо/Моб)
export interface LocationCreature {
  id: string;
  name: string;
  description: string | null;
  masterNotes: string | null;
  stats: string | null;
  quantity: number;
  isPublished: boolean;
  isDefeated: boolean;
  locationId: string;
  createdAt: Date;
}

// Loot Item
export interface LootItem {
  id: string;
  name: string;
  description: string | null;
  masterNotes: string | null;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isPublished: boolean;
  isCollected: boolean;
  locationId: string;
  createdAt: Date;
}

export interface LootItemPlayerView {
  id: string;
  name: string;
  description: string | null;
  value: number;
  rarity: string;
  isCollected: boolean;
}

// Event (Событие)
export interface Event {
  id: string;
  name: string;
  description: string | null;
  masterNotes: string | null;
  publicDesc: string | null;
  eventType: 'story' | 'combat' | 'social' | 'discovery';
  isPublished: boolean;
  isCompleted: boolean;
  order: number;
  partId: string | null;
  locationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPlayerView {
  id: string;
  name: string;
  publicDesc: string | null;
  eventType: string;
  isCompleted: boolean;
  order: number;
}

// Wiki Entry
export interface WikiEntry {
  id: string;
  title: string;
  content: string | null;
  masterContent: string | null;
  category: 'lore' | 'faction' | 'mythology' | 'item' | 'other';
  imageUrl: string | null;
  isPublished: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiEntryPlayerView {
  id: string;
  title: string;
  content: string | null;
  category: string;
  imageUrl: string | null;
}

// Chat Message
export interface ChatMessage {
  id: string;
  content: string;
  isSystem: boolean;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  companyId: string;
  createdAt: Date;
}
