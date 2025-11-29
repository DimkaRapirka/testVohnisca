'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Link, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Изображение',
  placeholder = 'https://...',
  className,
}: ImageUploadProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    setIsUploading(true);
    setPreviewError(false);

    try {
      // Конвертируем в base64 для локального хранения
      // В продакшене здесь будет загрузка на S3/Cloudinary
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onChange(base64);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Ошибка чтения файла');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки');
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreviewError(false);
    onChange(url);
  };

  const clearImage = () => {
    onChange('');
    setPreviewError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      
      {/* Переключатель режима */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
        >
          <Link className="h-4 w-4 mr-1" />
          URL
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
        >
          <Upload className="h-4 w-4 mr-1" />
          Загрузить
        </Button>
      </div>

      {/* URL ввод */}
      {mode === 'url' && (
        <Input
          value={value || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {/* Загрузка файла */}
      {mode === 'upload' && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            'hover:border-primary/50 hover:bg-primary/5',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-gray-400">Загрузка...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-gray-400">
                Нажмите или перетащите изображение
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF до 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Превью */}
      {value && !previewError && (
        <div className="relative mt-2">
          <div className="relative rounded-lg overflow-hidden bg-background-tertiary">
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-48 object-contain"
              onError={() => setPreviewError(true)}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ошибка превью */}
      {value && previewError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <ImageIcon className="h-4 w-4" />
          <span>Не удалось загрузить изображение</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearImage}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Компактная версия для аватаров
export function AvatarUpload({
  value,
  onChange,
  size = 'default',
}: {
  value?: string;
  onChange: (url: string) => void;
  size?: 'sm' | 'default' | 'lg';
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    default: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target?.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Ошибка чтения файла');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        'relative rounded-full bg-background-tertiary flex items-center justify-center cursor-pointer group overflow-hidden',
        sizeClasses[size]
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading ? (
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      ) : value ? (
        <>
          <img
            src={value}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-primary transition-colors">
          <Upload className="h-6 w-6" />
          <span className="text-xs">Фото</span>
        </div>
      )}

      {value && (
        <button
          type="button"
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
