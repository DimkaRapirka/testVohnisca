'use client';

import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export function ImageLightbox({ open, onOpenChange, imageUrl, alt = 'Image' }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleReset = () => setZoom(100);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-gray-800">
        {/* Панель управления */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="bg-black/50 hover:bg-black/70"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="bg-black/50 hover:bg-black/70"
          >
            {zoom}%
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="bg-black/50 hover:bg-black/70"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="bg-black/50 hover:bg-black/70"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-black/50 hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Изображение */}
        <div className="w-full h-[95vh] flex items-center justify-center overflow-auto p-8">
          <img
            src={imageUrl}
            alt={alt}
            className={cn(
              'transition-transform duration-200 cursor-zoom-in',
              zoom > 100 && 'cursor-zoom-out'
            )}
            style={{ 
              transform: `scale(${zoom / 100})`,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            onClick={() => {
              if (zoom > 100) {
                handleReset();
              } else {
                handleZoomIn();
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
