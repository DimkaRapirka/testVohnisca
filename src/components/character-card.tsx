'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CharacterExportButton } from './character-import-export';
import {
  Heart,
  Shield,
  Star,
  Edit,
  Plus,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Coins,
  Scroll,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterCardProps {
  character: any;
  isOwner?: boolean;
  isMaster?: boolean;
  onEdit?: () => void;
  onAddMilestone?: () => void;
  onQuickUpdate?: (data: any) => void;
  compact?: boolean;
}

export function CharacterCard({
  character,
  isOwner = false,
  isMaster = false,
  onEdit,
  onAddMilestone,
  onQuickUpdate,
  compact = false,
}: CharacterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCharacterTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      player: { label: 'Игрок', color: 'bg-blue-500/20 text-blue-400' },
      npc: { label: 'NPC', color: 'bg-purple-500/20 text-purple-400' },
      companion: { label: 'Спутник', color: 'bg-green-500/20 text-green-400' },
    };
    return labels[type] || labels.player;
  };

  const typeInfo = getCharacterTypeLabel(character.characterType);

  if (compact) {
    return (
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CharacterAvatar character={character} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{character.name}</h3>
                <Badge variant="secondary" className={cn('text-xs', typeInfo.color)}>
                  {typeInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {character.race} {character.class} • Ур. {character.level}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <HPBar hp={character.hp} maxHp={character.maxHp} size="sm" />
              <span className="text-sm text-gray-400">{character.ac} AC</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <CharacterAvatar character={character} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">{character.name}</CardTitle>
                <Badge variant="secondary" className={cn('text-xs', typeInfo.color)}>
                  {typeInfo.label}
                </Badge>
                {!character.isPublic && (
                  <span title="Скрытый персонаж">
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  </span>
                )}
              </div>
              <CardDescription>
                {character.race && `${character.race} `}
                {character.class} • Уровень {character.level}
                {character.background && ` • ${character.background}`}
              </CardDescription>
              {character.quote && (
                <p className="text-sm italic text-primary mt-2">"{character.quote}"</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isOwner || isMaster) && (
              <CharacterExportButton character={character} />
            )}
            {(isOwner || isMaster) && onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {(isOwner || isMaster) && onAddMilestone && (
              <Button variant="ghost" size="sm" onClick={onAddMilestone} title="Добавить достижение">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Основные характеристики */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <HPBar hp={character.hp} maxHp={character.maxHp} editable={isMaster} onUpdate={onQuickUpdate} />
            <p className="text-xs text-gray-500 mt-1">Здоровье</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-lg font-bold">{character.ac}</span>
            </div>
            <p className="text-xs text-gray-500">Класс брони</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-bold">
                <span className="text-yellow-500">{character.gold || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-300">{character.silver || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-orange-600">{character.copper || 0}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500">зм/см/мм</p>
          </div>
        </div>

        {/* Достижения */}
        {character.milestones?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Достижения
            </h4>
            <div className="space-y-1">
              {character.milestones.slice(0, 3).map((milestone: any) => (
                <MilestoneItem key={milestone.id} milestone={milestone} />
              ))}
            </div>
            {character._count?.milestones > 3 && (
              <p className="text-xs text-gray-500 mt-1">
                +{character._count.milestones - 3} достижений
              </p>
            )}
          </div>
        )}

        {/* Расширенная информация */}
        {(character.backstory || character.personality || character.ideals || character.bonds || character.flaws) && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mb-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
              {isExpanded ? 'Скрыть детали' : 'Показать детали'}
            </Button>

            {isExpanded && (
              <div className="space-y-3 text-sm">
                {character.backstory && (
                  <DetailSection title="Предыстория" content={character.backstory} icon={<Scroll className="h-4 w-4" />} />
                )}
                {character.personality && (
                  <DetailSection title="Характер" content={character.personality} />
                )}
                {character.ideals && (
                  <DetailSection title="Идеалы" content={character.ideals} />
                )}
                {character.bonds && (
                  <DetailSection title="Привязанности" content={character.bonds} />
                )}
                {character.flaws && (
                  <DetailSection title="Слабости" content={character.flaws} />
                )}
                {character.appearance && (
                  <DetailSection title="Внешность" content={character.appearance} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Владелец */}
        {character.user && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              {character.characterType === 'npc' ? 'Создан' : 'Игрок'}: {character.user.name || character.user.email}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSection({ title, content, icon }: { title: string; content: string; icon?: React.ReactNode }) {
  return (
    <div>
      <h5 className="font-medium text-primary mb-1 flex items-center gap-1">
        {icon}
        {title}
      </h5>
      <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function CharacterAvatar({ character, size = 'default' }: { character: any; size?: 'sm' | 'default' }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    default: 'w-16 h-16 text-lg',
  };

  return (
    <div className={cn('rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold', sizeClasses[size])}>
      {character.avatarUrl ? (
        <img src={character.avatarUrl} alt={character.name} className="w-full h-full rounded-full object-cover" />
      ) : (
        character.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function HPBar({ 
  hp, 
  maxHp, 
  size = 'default',
  editable = false,
  onUpdate,
}: { 
  hp: number; 
  maxHp: number; 
  size?: 'sm' | 'default';
  editable?: boolean;
  onUpdate?: (data: any) => void;
}) {
  const percent = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const color = percent > 50 ? 'bg-green-500' : percent > 25 ? 'bg-yellow-500' : 'bg-red-500';
  
  const heightClass = size === 'sm' ? 'h-1' : 'h-2';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="w-full">
      <div className={cn('flex items-center justify-center gap-1 mb-1', textSize)}>
        <Heart className="h-3 w-3 text-red-400" />
        <span>{hp}/{maxHp}</span>
      </div>
      <div className={cn('bg-gray-700 rounded-full overflow-hidden', heightClass)}>
        <div className={cn('transition-all', color, heightClass)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MilestoneItem({ milestone }: { milestone: any }) {
  const iconMap: Record<string, React.ReactNode> = {
    star: <Star className="h-3 w-3 text-yellow-500" />,
    default: <Star className="h-3 w-3 text-primary" />,
  };

  return (
    <div className="flex items-center gap-2 text-sm p-2 rounded bg-background-tertiary">
      {iconMap[milestone.iconType] || iconMap.default}
      <span className="flex-1 truncate">{milestone.title}</span>
      {milestone.sessionNumber && (
        <span className="text-xs text-gray-500">Сессия #{milestone.sessionNumber}</span>
      )}
    </div>
  );
}

export { CharacterAvatar, HPBar };
