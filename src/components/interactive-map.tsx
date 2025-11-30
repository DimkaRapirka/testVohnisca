'use client';

import { useState, useRef } from 'react';
import { MapMarker as MapMarkerType } from '@/types/map';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapMarkerCard } from './map-marker-card';

interface InteractiveMapProps {
  imageUrl: string;
  markers: MapMarkerType[];
  isMaster: boolean;
  onMarkerClick?: (marker: MapMarkerType) => void;
  onMapClick?: (x: number, y: number) => void;
  onMarkerMove?: (markerId: string, x: number, y: number) => void;
  onMarkerEdit?: (marker: MapMarkerType) => void;
  onMarkerDelete?: (markerId: string) => void;
  editMode?: boolean;
}

export function InteractiveMap({
  imageUrl,
  markers,
  isMaster,
  onMarkerClick,
  onMapClick,
  onMarkerMove,
  onMarkerEdit,
  onMarkerDelete,
  editMode = false,
}: InteractiveMapProps) {
  const [zoom, setZoom] = useState(100);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerType | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onMapClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onMapClick(x, y);
  };

  const handleMarkerDragStart = (markerId: string) => {
    if (editMode) {
      setDraggingMarker(markerId);
    }
  };

  const handleMarkerDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingMarker || !editMode || !onMarkerMove || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    onMarkerMove(draggingMarker, x, y);
  };

  const handleMarkerDragEnd = () => {
    setDraggingMarker(null);
  };

  const getMarkerIcon = (iconType: string) => {
    const icons: Record<string, string> = {
      pin: '📍',
      castle: '🏰',
      village: '🏘️',
      cave: '🕳️',
      portal: '🌀',
      mountain: '⛰️',
      forest: '🌲',
      water: '💧',
    };
    return icons[iconType] || '📍';
  };

  return (
    <div className="relative w-full h-full bg-background-tertiary rounded-lg overflow-hidden">
      {/* Панель управления */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="bg-black/70 hover:bg-black/90"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetZoom}
          className="bg-black/70 hover:bg-black/90"
        >
          {zoom}%
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="bg-black/70 hover:bg-black/90"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Карта */}
      <div 
        ref={mapRef}
        className="relative w-full h-full overflow-auto"
        onMouseMove={handleMarkerDrag}
        onMouseUp={handleMarkerDragEnd}
        onMouseLeave={handleMarkerDragEnd}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoom / 100)}%`,
            height: `${100 / (zoom / 100)}%`,
          }}
          onClick={handleMapClick}
        >
          <img
            src={imageUrl}
            alt="Map"
            className="w-full h-auto select-none"
            draggable={false}
          />

          {/* Метки */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110',
                editMode && 'cursor-move',
                draggingMarker === marker.id && 'scale-125 z-30'
              )}
              style={{
                left: `${marker.posX}%`,
                top: `${marker.posY}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(marker);
                onMarkerClick?.(marker);
              }}
              onMouseDown={() => handleMarkerDragStart(marker.id)}
            >
              <div
                className="relative flex flex-col items-center"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
              >
                {/* Иконка метки */}
                <div
                  className="text-2xl mb-1"
                  style={{
                    filter: `drop-shadow(0 0 3px ${marker.color})`,
                  }}
                >
                  {getMarkerIcon(marker.iconType)}
                </div>
                
                {/* Название */}
                <div
                  className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: marker.color,
                    color: '#fff',
                  }}
                >
                  {marker.name}
                </div>

                {/* Индикатор связанной карты */}
                {marker.linkedMapId && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Карточка выбранной метки */}
      {selectedMarker && (
        <MapMarkerCard
          marker={selectedMarker}
          isMaster={isMaster}
          onClose={() => setSelectedMarker(null)}
          onEdit={editMode && onMarkerEdit ? () => {
            onMarkerEdit(selectedMarker);
            setSelectedMarker(null);
          } : undefined}
          onDelete={editMode && onMarkerDelete ? () => {
            onMarkerDelete(selectedMarker.id);
            setSelectedMarker(null);
          } : undefined}
        />
      )}
    </div>
  );
}
