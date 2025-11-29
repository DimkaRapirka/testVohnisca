'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ImageUpload } from './image-upload';
import { Image, Plus, X, ZoomIn } from 'lucide-react';

interface SessionGalleryProps {
  sessionId: string;
  canUpload: boolean;
}

export function SessionGallery({ sessionId, canUpload }: SessionGalleryProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewImage, setViewImage] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ['session-images', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/images`);
      if (!res.ok) throw new Error('Failed to fetch images');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/sessions/${sessionId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-images', sessionId] });
    },
  });

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Загрузка галереи...</div>;
  }

  if (!images?.length && !canUpload) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Image className="h-4 w-4" />
          Галерея ({images?.length || 0})
        </h4>
        {canUpload && (
          <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        )}
      </div>

      {images?.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img: any) => (
            <div
              key={img.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-background-tertiary cursor-pointer"
              onClick={() => setViewImage(img)}
            >
              <img
                src={img.url}
                alt={img.caption || 'Session image'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
              {canUpload && (
                <button
                  className="absolute top-1 right-1 p-1 rounded bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(img.id);
                  }}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          Нет изображений
        </div>
      )}

      {/* Диалог добавления */}
      <AddImageDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        sessionId={sessionId}
      />

      {/* Просмотр изображения */}
      <ImageViewDialog
        image={viewImage}
        onClose={() => setViewImage(null)}
      />
    </div>
  );
}

function AddImageDialog({
  open,
  onOpenChange,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (data: { url: string; caption?: string }) => {
      const res = await fetch(`/api/sessions/${sessionId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-images', sessionId] });
      onOpenChange(false);
      setUrl('');
      setCaption('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      addMutation.mutate({ url, caption: caption || undefined });
    }
  };

  const handleImageChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Добавить изображение
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            value={url}
            onChange={handleImageChange}
            label="Изображение"
          />

          <div>
            <Label htmlFor="caption">Подпись</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Описание изображения..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!url || addMutation.isPending}>
              {addMutation.isPending ? 'Добавление...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImageViewDialog({
  image,
  onClose,
}: {
  image: any;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <img
          src={image.url}
          alt={image.caption || 'Session image'}
          className="w-full max-h-[80vh] object-contain"
        />
        {image.caption && (
          <p className="text-center text-gray-400 mt-2">{image.caption}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
