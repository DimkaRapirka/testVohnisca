// Типы для интерактивных карт

export type MarkerType = 'location' | 'city' | 'dungeon' | 'npc' | 'region' | 'custom';
export type IconType = 'pin' | 'castle' | 'village' | 'cave' | 'portal' | 'mountain' | 'forest' | 'water';

export interface CompanyMap {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  order: number;
  isPublished: boolean;
  companyId: string;
  parentMapId?: string;
  parentMap?: CompanyMap;
  childMaps?: CompanyMap[];
  markers?: MapMarker[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MapMarker {
  id: string;
  name: string;
  description?: string;
  masterNotes?: string;
  posX: number; // 0-100
  posY: number; // 0-100
  markerType: MarkerType;
  iconType: IconType;
  color: string;
  isPublished: boolean;
  linkedMapId?: string;
  linkedMap?: CompanyMap;
  locationId?: string;
  sessionId?: string;
  npcId?: string;
  mapId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapBreadcrumb {
  id: string;
  name: string;
}
