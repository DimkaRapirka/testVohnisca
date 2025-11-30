'use client';

import { MapMarker } from '@/types/map';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, MapPin, Lock, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapMarkerCardProps {
  marker: MapMarker;
  isMaster: boolean;
  onClose: () => void;
  onNavigateToMap?: (mapId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MapMarkerCard({ marker, isMaster, onClose, onNavigateToMap, onEdit, onDelete }: MapMarkerCardProps) {
  const markerTypeLabels: Record<string, string> = {
    location: 'Локация',
    city: 'Город',
    dungeon: 'Подземелье',
    npc: 'NPC',
    region: 'Регион',
    custom: 'Метка',
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 w-80 max-w-[calc(100%-2rem)]">
      <Card className="border-2" style={{ borderColor: marker.color }}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{marker.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${marker.color}20`, color: marker.color }}
                >
                  {markerTypeLabels[marker.markerType]}
                </Badge>
              </div>
              {!marker.isPublished && isMaster && (
                <Badge variant="secondary" className="text-xs bg-gray-700">
                  <Lock className="h-3 w-3 mr-1" />
                  Скрыто от игроков
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Описание */}
          {marker.description && (
            <div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {marker.description}
              </p>
            </div>
          )}

          {/* Заметки мастера */}
          {isMaster && marker.masterNotes && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Заметки мастера</span>
              </div>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">
                {marker.masterNotes}
              </p>
            </div>
          )}

          {/* Связанная карта */}
          {marker.linkedMapId && (
            <Button
              className="w-full"
              onClick={() => onNavigateToMap?.(marker.linkedMapId!)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Перейти к карте региона
            </Button>
          )}

          {/* Связанные сущности */}
          <div className="flex flex-wrap gap-2">
            {marker.locationId && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Локация
              </Button>
            )}
            {marker.sessionId && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Сессия
              </Button>
            )}
            {marker.npcId && (
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                NPC
              </Button>
            )}
          </div>

          {/* Кнопки редактирования и удаления */}
          {(onEdit || onDelete) && (
            <div className="flex gap-2 pt-2 border-t border-gray-700">
              {onEdit && (
                <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
