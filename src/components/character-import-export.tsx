'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Download, Upload, FileText, AlertCircle } from 'lucide-react';
import { downloadCharacterJSON, readCharacterFile } from '@/lib/character-export';

interface CharacterImportExportProps {
  character?: any;
  onImport?: (characterData: any) => Promise<void> | void;
}

export function CharacterImportExport({ character, onImport }: CharacterImportExportProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (character) {
      downloadCharacterJSON(character);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // Читаем и парсим файл
      const characterData = await readCharacterFile(file);
      console.log('Parsed character data:', characterData);
      
      // Вызываем callback для создания персонажа
      await onImport?.(characterData);
      
      setImportSuccess(`Персонаж "${characterData.name}" успешно импортирован!`);
      
      // Закрываем диалог через 1.5 секунды
      setTimeout(() => {
        setIsImportOpen(false);
        setImportSuccess(null);
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Ошибка импорта');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {character && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Импорт
        </Button>
      </div>

      {/* Диалог импорта */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Импорт персонажа
            </DialogTitle>
            <DialogDescription>
              Загрузите JSON файл персонажа из LongStoryShort
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="character-file">Выберите файл</Label>
              <Input
                ref={fileInputRef}
                id="character-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>

            {importError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
                <span>✓</span>
                <span>{importSuccess}</span>
              </div>
            )}

            {isImporting && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">Импорт персонажа...</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p><strong>Поддерживаемые форматы:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>JSON файлы из LongStoryShort</li>
                <li>Экспортированные из Vohnisca персонажи</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Компактная версия для меню
export function CharacterExportButton({ character }: { character: any }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => downloadCharacterJSON(character)}
      title="Экспорт в LongStoryShort"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
