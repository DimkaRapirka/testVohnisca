// Экспорт/импорт персонажей в формате LongStoryShort

export interface LSSCharacterData {
  tags: string[];
  disabledBlocks: {
    'info-left': string[];
    'info-right': string[];
    'notes-left': string[];
    'notes-right': string[];
    _id?: string;
  };
  edition: string;
  spells: {
    mode: string;
    prepared: string[];
    book: string[];
  };
  data: string; // JSON строка с данными персонажа
  jsonType: string;
  version: string;
}

// Конвертация из нашего формата в LSS
export function exportToLSS(character: any): LSSCharacterData {
  const calcModifier = (score: number) => Math.floor((score - 10) / 2);

  const innerData = {
    isDefault: true,
    jsonType: 'character',
    template: 'default',
    name: { value: character.name || '' },
    info: {
      charClass: { name: 'charClass', value: character.class || '', label: 'класс и уровень' },
      charSubclass: { name: 'charSubclass', value: '' },
      level: { name: 'level', value: character.level || 1, label: 'уровень' },
      background: { name: 'background', value: character.background || '', label: 'предыстория' },
      playerName: { name: 'playerName', value: '', label: 'имя игрока' },
      race: { name: 'race', value: character.race || '', label: 'раса' },
      alignment: { name: 'alignment', value: character.alignment || '', label: 'мировоззрение' },
      experience: { name: 'experience', value: character.experience?.toString() || '', label: 'опыт' },
    },
    subInfo: {
      age: { name: 'age', value: '', label: 'возраст' },
      height: { name: 'height', value: '', label: 'рост' },
      weight: { name: 'weight', value: '', label: 'вес' },
      eyes: { name: 'eyes', value: '', label: 'глаза' },
      skin: { name: 'skin', value: '', label: 'кожа' },
      hair: { name: 'hair', value: '', label: 'волосы' },
    },
    spellsInfo: {
      base: { name: 'base', value: '', label: 'Базовая характеристика заклинаний' },
      save: { name: 'save', value: '', label: 'Сложность спасброска' },
      mod: { name: 'mod', value: '', label: 'Бонус атаки заклинанием' },
      available: { classes: [] as string[] },
    },
    spells: {},
    spellsPact: {},
    proficiency: Math.ceil(1 + (character.level || 1) / 4),
    stats: {
      str: { name: 'str', score: character.strength || 10, modifier: calcModifier(character.strength || 10), label: 'Сила', check: calcModifier(character.strength || 10) },
      dex: { name: 'dex', score: character.dexterity || 10, modifier: calcModifier(character.dexterity || 10), label: 'Ловкость', check: calcModifier(character.dexterity || 10) },
      con: { name: 'con', score: character.constitution || 10, modifier: calcModifier(character.constitution || 10), label: 'Телосложение', check: calcModifier(character.constitution || 10) },
      int: { name: 'int', score: character.intelligence || 10, modifier: calcModifier(character.intelligence || 10), label: 'Интеллект', check: calcModifier(character.intelligence || 10) },
      wis: { name: 'wis', score: character.wisdom || 10, modifier: calcModifier(character.wisdom || 10), label: 'Мудрость', check: calcModifier(character.wisdom || 10) },
      cha: { name: 'cha', score: character.charisma || 10, modifier: calcModifier(character.charisma || 10), label: 'Харизма', check: calcModifier(character.charisma || 10) },
    },
    saves: {
      str: { name: 'str', isProf: false },
      dex: { name: 'dex', isProf: false, bonus: null },
      con: { name: 'con', isProf: false },
      int: { name: 'int', isProf: false },
      wis: { name: 'wis', isProf: false, bonus: null },
      cha: { name: 'cha', isProf: false },
    },
    skills: {
      acrobatics: { baseStat: 'dex', name: 'acrobatics', label: 'Акробатика' },
      investigation: { baseStat: 'int', name: 'investigation', label: 'Анализ' },
      athletics: { baseStat: 'str', name: 'athletics', label: 'Атлетика' },
      perception: { baseStat: 'wis', name: 'perception', label: 'Восприятие' },
      survival: { baseStat: 'wis', name: 'survival', label: 'Выживание' },
      performance: { baseStat: 'cha', name: 'performance', label: 'Выступление' },
      intimidation: { baseStat: 'cha', name: 'intimidation', label: 'Запугивание' },
      history: { baseStat: 'int', name: 'history', label: 'История' },
      'sleight of hand': { baseStat: 'dex', name: 'sleight of hand', label: 'Ловкость рук' },
      arcana: { baseStat: 'int', name: 'arcana', label: 'Магия' },
      medicine: { baseStat: 'wis', name: 'medicine', label: 'Медицина' },
      deception: { baseStat: 'cha', name: 'deception', label: 'Обман' },
      nature: { baseStat: 'int', name: 'nature', label: 'Природа' },
      insight: { baseStat: 'wis', name: 'insight', label: 'Проницательность' },
      religion: { baseStat: 'int', name: 'religion', label: 'Религия' },
      stealth: { baseStat: 'dex', name: 'stealth', label: 'Скрытность' },
      persuasion: { baseStat: 'cha', name: 'persuasion', label: 'Убеждение' },
      'animal handling': { baseStat: 'wis', name: 'animal handling', label: 'Уход за животными' },
    },
    vitality: {
      'hp-dice-current': { value: character.level || 1 },
      'hp-dice-multi': {},
      ac: { value: character.ac || 10 },
      'hp-current': { value: character.hp || character.maxHp || 10 },
      'hp-temp': { value: 0 },
      'hp-max': { value: character.maxHp || 10 },
      'hit-die': { value: 'd8' },
      isDying: false,
      deathFails: 0,
      deathSuccesses: 0,
    },
    attunementsList: [
      { id: `attunement-${Date.now()}`, checked: false, value: '' },
    ],
    weaponsList: [
      { id: `weapon-${Date.now()}`, name: { value: '' }, mod: { value: '+0' }, dmg: { value: '' }, ability: 'str', modBonus: { value: 0 } },
    ],
    weapons: {},
    text: {
      'notes-1': character.notes ? {
        value: {
          id: `hover-toolbar-notes-1-${Date.now()}`,
          data: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: character.notes }] }],
          },
        },
      } : { value: { id: `hover-toolbar-notes-1-${Date.now()}`, data: { type: 'doc', content: [{ type: 'paragraph' }] } } },
      traits: character.personality ? {
        value: {
          id: `hover-toolbar-traits-${Date.now()}`,
          data: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: character.personality }] }],
          },
        },
      } : undefined,
    },
    coins: {
      gp: { value: character.gold || 0 },
      total: { value: (character.gold || 0) + (character.silver || 0) / 10 + (character.copper || 0) / 100 },
      sp: { value: character.silver || 0 },
      cp: { value: character.copper || 0 },
      pp: { value: 0 },
      ep: { value: 0 },
    },
    resources: {},
    bonusesSkills: {},
    bonusesStats: {},
    conditions: [] as string[],
    createdAt: new Date().toISOString(),
    inspiration: false,
    avatar: character.avatarUrl ? {
      jpeg: character.avatarUrl,
      webp: character.avatarUrl,
    } : undefined,
  };

  return {
    tags: [],
    disabledBlocks: {
      'info-left': [],
      'info-right': [],
      'notes-left': [],
      'notes-right': [],
      _id: `${Date.now().toString(16)}`,
    },
    edition: '2024',
    spells: {
      mode: 'cards',
      prepared: [],
      book: [],
    },
    data: JSON.stringify(innerData),
    jsonType: 'character',
    version: '2',
  };
}

// Конвертация из LSS в наш формат
export function importFromLSS(lssData: LSSCharacterData): Partial<any> {
  const innerData = JSON.parse(lssData.data);

  // Извлекаем текст из TipTap формата
  const extractText = (textObj: any): string => {
    if (!textObj?.value?.data?.content) return '';
    return textObj.value.data.content
      .map((block: any) => block.content?.map((c: any) => c.text || '').join('') || '')
      .join('\n');
  };

  // Получаем имя (обязательное поле)
  const name = innerData.name?.value?.trim() || 'Безымянный';
  
  // Получаем класс (обязательное поле - минимум 1 символ)
  const charClass = innerData.info?.charClass?.value?.trim() || 'Авантюрист';

  // Безопасно получаем числовые значения
  const safeInt = (val: any, defaultVal: number): number => {
    const num = parseInt(val);
    return isNaN(num) ? defaultVal : num;
  };

  return {
    name,
    class: charClass,
    race: innerData.info?.race?.value?.trim() || undefined,
    level: safeInt(innerData.info?.level?.value, 1),
    background: innerData.info?.background?.value?.trim() || undefined,
    alignment: innerData.info?.alignment?.value?.trim() || undefined,
    
    strength: safeInt(innerData.stats?.str?.score, 10),
    dexterity: safeInt(innerData.stats?.dex?.score, 10),
    constitution: safeInt(innerData.stats?.con?.score, 10),
    intelligence: safeInt(innerData.stats?.int?.score, 10),
    wisdom: safeInt(innerData.stats?.wis?.score, 10),
    charisma: safeInt(innerData.stats?.cha?.score, 10),
    
    hp: safeInt(innerData.vitality?.['hp-current']?.value, 10) || safeInt(innerData.vitality?.['hp-max']?.value, 10),
    maxHp: safeInt(innerData.vitality?.['hp-max']?.value, 10),
    ac: safeInt(innerData.vitality?.ac?.value, 10),
    
    gold: safeInt(innerData.coins?.gp?.value, 0),
    silver: safeInt(innerData.coins?.sp?.value, 0),
    copper: safeInt(innerData.coins?.cp?.value, 0),
    
    avatarUrl: innerData.avatar?.jpeg || innerData.avatar?.webp || undefined,
    
    personality: extractText(innerData.text?.traits) || undefined,
    notes: extractText(innerData.text?.['notes-1']) || undefined,
    
    // Автоматически помечаем как игрового персонажа
    characterType: 'player',
    isPublic: true,
  };
}

// Скачать файл
export function downloadCharacterJSON(character: any) {
  const lssData = exportToLSS(character);
  const json = JSON.stringify(lssData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(character.name || 'character').replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Прочитать файл
export function readCharacterFile(file: File): Promise<Partial<any>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Проверяем что это LSS формат
        if (json.jsonType !== 'character' || !json.data) {
          reject(new Error('Неверный формат файла. Ожидается файл из LongStoryShort.'));
          return;
        }
        
        const character = importFromLSS(json);
        resolve(character);
      } catch (error) {
        reject(new Error('Ошибка чтения файла. Проверьте формат JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}
