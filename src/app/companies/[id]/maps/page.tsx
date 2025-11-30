'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InteractiveMap } from '@/components/interactive-map';
import { MapEditorDialog } from '@/components/map-editor-dialog';
import { MarkerEditorDialog } from '@/components/marker-editor-dialog';
import { MapMarker as MapMarkerType, CompanyMap } from '@/types/map';
import { 
  Map as MapIcon, 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

export default function CompanyMapsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const companyId = params.id as string;

  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<any>(null);
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<{ x: number; y: number } | undefined>();
  const [editingMarker, setEditingMarker] = useState<any>(null);

  // Загружаем компанию
  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
  });

  const playerIds = company?.players?.map((p: any) => p.userId) || [];
  const { isMaster } = useUserRole(company?.masterId, playerIds);

  // Загружаем корневые карты
  const { data: rootMaps, isLoading: mapsLoading } = useQuery({
    queryKey: ['maps', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/maps`);
      if (!res.ok) throw new Error('Failed to fetch maps');
      return res.json();
    },
    enabled: !!company && !currentMapId,
  });

  // Загружаем текущую карту
  const { data: currentMap, isLoading: mapLoading } = useQuery({
    queryKey: ['map', currentMapId],
    queryFn: async () => {
      const res = await fetch(`/api/maps/${currentMapId}`);
      if (!res.ok) throw new Error('Failed to fetch map');
      return res.json();
    },
    enabled: !!currentMapId,
  });

  const handleNavigateToMap = (mapId: string, mapName: string) => {
    setBreadcrumbs([...breadcrumbs, { id: currentMapId || 'root', name: currentMap?.name || 'Карты' }]);
    setCurrentMapId(mapId);
  };

  const handleNavigateBack = () => {
    if (breadcrumbs.length === 0) {
      setCurrentMapId(null);
      return;
    }

    const prev = breadcrumbs[breadcrumbs.length - 1];
    setBreadcrumbs(breadcrumbs.slice(0, -1));
    
    if (prev.id === 'root') {
      setCurrentMapId(null);
    } else {
      setCurrentMapId(prev.id);
    }
  };

  const handleMarkerClick = (marker: MapMarkerType) => {
    if (marker.linkedMapId) {
      handleNavigateToMap(marker.linkedMapId, marker.name);
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen">
        <Navbar user={session?.user} />
        <div className="container mx-auto py-8">
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(`/companies/${companyId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              К кампании
            </Button>
            
            {/* Хлебные крошки */}
            {currentMapId && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentMapId(null);
                    setBreadcrumbs([]);
                  }}
                >
                  Карты
                </Button>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBreadcrumbs(breadcrumbs.slice(0, index));
                        setCurrentMapId(crumb.id === 'root' ? null : crumb.id);
                      }}
                    >
                      {crumb.name}
                    </Button>
                  </div>
                ))}
                {currentMap && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-primary">{currentMap.name}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {isMaster && (
            <div className="flex gap-2">
              {currentMapId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingMap(currentMap);
                      setIsMapDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Настроить карту
                  </Button>
                  <Button
                    variant={editMode ? 'default' : 'outline'}
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {editMode ? 'Готово' : 'Метки'}
                  </Button>
                </>
              )}
              <Button onClick={() => {
                setEditingMap(null);
                setIsMapDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Новая карта
              </Button>
            </div>
          )}
        </div>

        {/* Список карт или текущая карта */}
        {!currentMapId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapsLoading ? (
              <p className="text-gray-400">Загрузка карт...</p>
            ) : rootMaps?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <MapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-fantasy text-primary mb-2">
                    {isMaster ? 'Создайте первую карту' : 'Карт пока нет'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {isMaster 
                      ? 'Загрузите карту мира, региона или подземелья'
                      : 'Мастер ещё не добавил карты'
                    }
                  </p>
                  {isMaster && (
                    <Button onClick={() => setIsMapDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать карту
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              rootMaps?.map((map: CompanyMap) => (
                <Card
                  key={map.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setCurrentMapId(map.id)}
                >
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={map.imageUrl}
                      alt={map.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{map.name}</h3>
                        {map.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {map.description}
                          </p>
                        )}
                      </div>
                      {!map.isPublished && isMaster && (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Интерактивная карта */}
            <div className="h-[calc(100vh-20rem)]">
              {mapLoading ? (
                <Card className="h-full flex items-center justify-center">
                  <p className="text-gray-400">Загрузка карты...</p>
                </Card>
              ) : currentMap ? (
                <InteractiveMap
                  imageUrl={currentMap.imageUrl}
                  markers={currentMap.markers || []}
                  isMaster={isMaster}
                  editMode={editMode}
                  onMarkerClick={(marker) => {
                    if (marker.linkedMapId && !editMode) {
                      handleNavigateToMap(marker.linkedMapId, marker.name);
                    }
                  }}
                  onMapClick={(x, y) => {
                    if (editMode) {
                      setEditingMarker(null);
                      setMarkerPosition({ x, y });
                      setIsMarkerDialogOpen(true);
                    }
                  }}
                  onMarkerMove={async (markerId, x, y) => {
                    await fetch(`/api/markers/${markerId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ posX: x, posY: y }),
                    });
                    queryClient.invalidateQueries({ queryKey: ['map', currentMapId] });
                  }}
                  onMarkerEdit={(marker) => {
                    setEditingMarker(marker);
                    setMarkerPosition(undefined);
                    setIsMarkerDialogOpen(true);
                  }}
                  onMarkerDelete={async (markerId) => {
                    if (confirm('Удалить эту метку?')) {
                      await fetch(`/api/markers/${markerId}`, { method: 'DELETE' });
                      queryClient.invalidateQueries({ queryKey: ['map', currentMapId] });
                    }
                  }}
                />
              ) : null}
            </div>

            {/* Дочерние карты */}
            {currentMap && currentMap.childMaps && currentMap.childMaps.length > 0 && (
              <div>
                <h3 className="text-xl font-fantasy text-primary mb-4">Детальные карты</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMap.childMaps.map((childMap: any) => (
                    <Card
                      key={childMap.id}
                      className="cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => handleNavigateToMap(childMap.id, childMap.name)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{childMap.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">Нажмите для просмотра</p>
                          </div>
                          {!childMap.isPublished && isMaster && (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Диалоги */}
      {isMaster && (
        <>
          <MapEditorDialog
            open={isMapDialogOpen}
            onOpenChange={(open) => {
              setIsMapDialogOpen(open);
              if (!open) setEditingMap(null);
            }}
            companyId={companyId}
            parentMapId={currentMapId || undefined}
            map={editingMap}
          />
          
          {currentMapId && (
            <MarkerEditorDialog
              open={isMarkerDialogOpen}
              onOpenChange={(open) => {
                setIsMarkerDialogOpen(open);
                if (!open) {
                  setMarkerPosition(undefined);
                  setEditingMarker(null);
                }
              }}
              mapId={currentMapId}
              companyId={companyId}
              initialPosition={markerPosition}
              marker={editingMarker}
            />
          )}
        </>
      )}
    </div>
  );
}
