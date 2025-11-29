export type CompanyStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type EncounterType = 'COMBAT' | 'SOCIAL' | 'EXPLORATION' | 'MIXED';
export type NotePrivacy = 'PUBLIC' | 'PRIVATE_MASTER' | 'PRIVATE_AUTHOR' | 'VISIBLE_TO_SUBSET';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  theme: string;
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  extendedDesc: string | null;
  genre: string | null;
  partyLevel: number;
  status: CompanyStatus;
  masterId: string;
  master?: User;
  players?: CompanyPlayer[];
  encounters?: Encounter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyPlayer {
  id: string;
  companyId: string;
  userId: string;
  user?: User;
  joinedAt: Date;
}

export interface Encounter {
  id: string;
  name: string;
  description: string | null;
  detailedDesc: string | null;
  type: EncounterType;
  order: number;
  parentId: string | null;
  companyId: string;
  company?: Company;
  parent?: Encounter;
  children?: Encounter[];
  notes?: Note[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  title: string | null;
  content: string;
  privacy: NotePrivacy;
  visibleTo: string;
  authorId: string;
  author?: User;
  encounterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CharacterType = 'player' | 'npc' | 'companion';

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  race: string | null;
  background: string | null;
  alignment: string | null;
  avatarUrl: string | null;
  
  // Характеристики
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Боевые параметры
  hp: number;
  maxHp: number;
  ac: number;
  
  // Ресурсы (монеты D&D)
  gold: number;
  silver: number;
  copper: number;
  experience: number;
  
  // LongStoryShort поля
  backstory: string | null;
  personality: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  appearance: string | null;
  quote: string | null;
  
  notes: string | null;
  
  // Тип и видимость
  characterType: CharacterType;
  isActive: boolean;
  isPublic: boolean;
  
  userId: string;
  user?: User;
  companyId: string | null;
  company?: Company;
  inventory?: InventoryItem[];
  milestones?: CharacterMilestone[];
  relationships?: CharacterRelationship[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterMilestone {
  id: string;
  characterId: string;
  title: string;
  description: string | null;
  sessionNumber: number | null;
  date: Date;
  iconType: string;
}

export interface CharacterRelationship {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  relationshipType: string;
  description: string | null;
  toCharacter?: Character;
}

export interface SessionLog {
  id: string;
  companyId: string;
  title: string;
  sessionNumber: number;
  summary: string;
  detailedNotes: string | null;
  playedAt: Date;
  duration: number | null;
  isPublished: boolean;
  coverImage: string | null;
  participants?: SessionParticipant[];
  locations?: SessionLocation[];
  images?: SessionImage[];
  playerNotes?: SessionPlayerNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionParticipant {
  id: string;
  sessionLogId: string;
  characterId: string | null;
  characterName: string;
  wasPresent: boolean;
  notes: string | null;
}

export interface SessionLocation {
  id: string;
  sessionLogId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  order: number;
}

export interface SessionImage {
  id: string;
  sessionLogId: string;
  url: string;
  caption: string | null;
  uploadedBy: string | null;
  order: number;
}

export interface SessionPlayerNote {
  id: string;
  sessionLogId: string;
  userId: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  weight: number;
  value: number;
  category: string | null;
  isEquipped: boolean;
  characterId: string;
}

export interface DiceRoll {
  id: string;
  diceType: string;
  result: number;
  modifier: number;
  total: number;
  purpose: string | null;
  userId: string;
  encounterId: string | null;
  createdAt: Date;
}
