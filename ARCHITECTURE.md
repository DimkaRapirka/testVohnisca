# Архітектура Vohnisca

## Огляд

Vohnisca - це full-stack веб-додаток для управління D&D кампаніями, побудований на Next.js 14 з використанням App Router, TypeScript, Prisma ORM та PostgreSQL.

## Технологічний стек

### Frontend
- **Next.js 14** (App Router) - React фреймворк з SSR/SSG
- **React 18** - UI бібліотека з Server Components
- **TypeScript** - типізація
- **Tailwind CSS** - utility-first CSS фреймворк
- **Radix UI** - доступні headless компоненти
- **Zustand** - легкий state management (для майбутнього використання)
- **React Query** - серверний state та кешування

### Backend
- **Next.js API Routes** - serverless API endpoints
- **Prisma ORM** - type-safe database client
- **PostgreSQL** - реляційна база даних
- **NextAuth.js** - авторизація та сесії
- **Zod** - валідація даних

### Інструменти
- **ESLint** - лінтинг коду
- **Prettier** - форматування коду
- **bcryptjs** - хешування паролів

## Структура проекту

\`\`\`
vohnisca/
├── prisma/
│   └── schema.prisma              # Схема бази даних
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API endpoints
│   │   │   ├── auth/             # Авторизація
│   │   │   ├── companies/        # CRUD компаній
│   │   │   ├── encounters/       # CRUD енкаунтерів
│   │   │   └── notes/            # CRUD заміток
│   │   ├── auth/                 # Сторінки авторизації
│   │   ├── companies/            # Сторінки компаній
│   │   ├── encounters/           # Сторінки енкаунтерів
│   │   ├── characters/           # Сторінки персонажів
│   │   │   ├── page.tsx         # Список персонажей
│   │   │   └── [id]/page.tsx    # Детальная страница персонажа
│   │   ├── sessions/            # Сторінки сесій
│   │   │   └── [id]/page.tsx    # Детальная страница сессии
│   │   ├── dice/                 # Сторінка дайсів (заглушка)
│   │   ├── reference/            # Довідник (заглушка)
│   │   ├── profile/              # Профіль користувача
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Головна сторінка
│   │   ├── providers.tsx         # React Query + NextAuth providers
│   │   └── globals.css           # Глобальні стилі
│   │
│   ├── components/               # Переиспользуемые компоненти
│   │   ├── ui/                  # Базові UI компоненти
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── textarea.tsx
│   │   ├── navbar.tsx           # Навігаційна панель
│   │   ├── campfire.tsx         # Canvas анімація вогнища
│   │   ├── character-card.tsx   # Карточка персонажа (LongStoryShort стиль)
│   │   ├── character-editor.tsx # Редактор персонажа
│   │   ├── character-select-modal.tsx # Выбор персонажа для кампании
│   │   ├── npc-editor.tsx       # Редактор NPC для мастера
│   │   ├── party-panel.tsx      # Панель партии
│   │   ├── party-panel-extended.tsx # Расширенная панель с быстрым HP
│   │   ├── session-chronicle.tsx # Хроника сессий
│   │   ├── session-editor.tsx   # Редактор сессий
│   │   └── session-gallery.tsx  # Галерея изображений сессии
│   │
│   ├── features/                # Доменні модулі (feature-based)
│   │   ├── companies/
│   │   │   └── create-company-dialog.tsx
│   │   ├── encounters/
│   │   │   └── create-encounter-dialog.tsx
│   │   └── notes/
│   │       ├── create-note-dialog.tsx
│   │       └── note-card.tsx
│   │
│   ├── lib/                     # Утиліти та конфігурація
│   │   ├── prisma.ts           # Prisma client singleton
│   │   └── utils.ts            # Хелпери (cn, formatDate, dice rolls)
│   │
│   ├── types/                   # TypeScript типи
│   │   ├── index.ts            # Доменні типи
│   │   └── next-auth.d.ts      # NextAuth розширення типів
│   │
│   └── middleware.ts            # Next.js middleware (auth protection)
│
├── .env.example                 # Приклад змінних оточення
├── .eslintrc.json              # ESLint конфігурація
├── .gitignore                  # Git ignore
├── .prettierrc                 # Prettier конфігурація
├── next.config.js              # Next.js конфігурація
├── package.json                # Залежності та скрипти
├── postcss.config.js           # PostCSS конфігурація
├── tailwind.config.ts          # Tailwind конфігурація
├── tsconfig.json               # TypeScript конфігурація
├── README.md                   # Документація
├── SETUP.md                    # Інструкція з налаштування
└── ARCHITECTURE.md             # Цей файл
\`\`\`

## Доменна модель

### Основні сутності

#### User (Користувач)
- Авторизація через email/пароль або OAuth (Google, Discord)
- Може бути майстром (DM) або гравцем
- Має профіль, налаштування, аватар

#### Company (Компанія/Кампанія)
- Належить одному майстру
- Містить список гравців
- Має статус: ACTIVE, PAUSED, COMPLETED
- Містить енкаунтери, персонажів, торговців

#### Encounter (Енкаунтер)
- Належить компанії
- Типи: COMBAT, SOCIAL, EXPLORATION, MIXED
- Може мати ієрархію (parent/children)
- Містить замітки та броски дайсів

#### Note (Замітка)
- Належить енкаунтеру та автору
- Рівні приватності:
  - PUBLIC - всі учасники компанії
  - PRIVATE_AUTHOR - тільки автор
  - PRIVATE_MASTER - тільки майстри
  - VISIBLE_TO_SUBSET - обмежений список користувачів

#### Character (Персонаж)
- Належить користувачу та компанії
- Характеристики D&D 5e (STR, DEX, CON, INT, WIS, CHA)
- HP, AC, рівень, клас, раса
- Інвентар, золото, досвід

### Додаткові сутності (для майбутнього)

- **InventoryItem** - предмети в інвентарі
- **Trader** - торговці та магазини
- **TraderGood** - товари торговців
- **DiceRoll** - історія бросків дайсів
- **Spell** - довідник заклинань
- **Creature** - бестіарій

## Потік даних

### Авторизація
1. Користувач реєструється через `/auth/signup` або OAuth
2. NextAuth створює сесію з JWT токеном
3. Middleware перевіряє авторизацію для захищених роутів
4. Session доступна через `useSession()` hook або `getServerSession()`

### CRUD операції
1. Клієнт відправляє запит через React Query mutation
2. API route перевіряє авторизацію через NextAuth
3. Валідація даних через Zod схеми
4. Prisma виконує операцію з БД
5. Відповідь повертається клієнту
6. React Query інвалідує кеш та оновлює UI

### Права доступу

#### Майстер (DM)
- Створення/редагування/видалення компаній
- Створення/редагування/видалення енкаунтерів
- Перегляд всіх заміток (включаючи PRIVATE_MASTER)
- Управління гравцями

#### Гравець
- Перегляд компаній, де є учасником
- Перегляд енкаунтерів
- Створення заміток (PUBLIC, PRIVATE_AUTHOR)
- Перегляд публічних заміток та своїх приватних

## API Endpoints

### Auth
- `POST /api/auth/signup` - реєстрація
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Companies
- `GET /api/companies` - список компаній користувача
- `POST /api/companies` - створити компанію
- `GET /api/companies/[id]` - деталі компанії
- `PATCH /api/companies/[id]` - оновити компанію
- `DELETE /api/companies/[id]` - видалити компанію

### Encounters
- `POST /api/encounters` - створити енкаунтер
- `GET /api/encounters/[id]` - деталі енкаунтера
- `PATCH /api/encounters/[id]` - оновити енкаунтер
- `DELETE /api/encounters/[id]` - видалити енкаунтер

### Notes
- `POST /api/notes` - створити замітку
- `PATCH /api/notes/[id]` - оновити замітку
- `DELETE /api/notes/[id]` - видалити замітку

### Characters (LongStoryShort стиль)
- `GET /api/characters` - список персонажів (фільтр: type, companyId, includePublic)
- `POST /api/characters` - створити персонажа
- `GET /api/characters/[id]` - деталі персонажа
- `PATCH /api/characters/[id]` - оновити персонажа
- `DELETE /api/characters/[id]` - видалити персонажа
- `PATCH /api/characters/[id]/quick-update` - швидке оновлення HP/AC/Gold
- `GET /api/characters/[id]/milestones` - досягнення персонажа
- `POST /api/characters/[id]/milestones` - додати досягнення

### Company NPCs (Мастерські персонажі)
- `GET /api/companies/[id]/npcs` - NPC кампанії
- `POST /api/companies/[id]/npcs` - створити NPC (тільки мастер)

### Company Party
- `GET /api/companies/[id]/party` - партія кампанії
- `POST /api/companies/[id]/select-character` - вибрати персонажа для кампанії

### Sessions (Хроніка)
- `GET /api/companies/[id]/sessions` - хроніка сесій
- `POST /api/companies/[id]/sessions` - створити сесію
- `GET /api/sessions/[id]` - деталі сесії
- `PATCH /api/sessions/[id]` - оновити сесію
- `GET /api/sessions/[id]/images` - галерея сесії
- `POST /api/sessions/[id]/images` - додати зображення
- `DELETE /api/sessions/[id]/images` - видалити зображення
- `GET /api/sessions/[id]/locations` - локації сесії
- `POST /api/sessions/[id]/locations` - додати локацію
- `GET /api/sessions/[id]/notes` - замітки гравців
- `POST /api/sessions/[id]/notes` - додати замітку

## Дизайн система

### Кольорова палітра

\`\`\`typescript
colors: {
  background: {
    DEFAULT: '#0a0a0f',      // Основний фон
    secondary: '#13131a',     // Вторинний фон
    tertiary: '#1a1a24',      // Третинний фон
  },
  primary: {
    DEFAULT: '#d4a574',       // Золото
    dark: '#b8895f',
    light: '#e8c9a0',
  },
  accent: {
    fire: '#ff6b35',          // Вогонь
    gold: '#f4a261',          // Золотий акцент
    ember: '#e76f51',         // Жар
  },
  fantasy: {
    purple: '#6a4c93',        // Фіолетовий
    green: '#2d4a3e',         // Зелений
    blue: '#264653',          // Синій
  },
}
\`\`\`

### Шрифти
- **Inter** - основний шрифт (sans-serif)
- **Cinzel** - декоративний для заголовків (fantasy)

### Компоненти
Використовуються Radix UI primitives з кастомною стилізацією через Tailwind CSS.

## Безпека

- Паролі хешуються через bcryptjs
- JWT токени для сесій
- CSRF захист через NextAuth
- SQL injection захист через Prisma
- XSS захист через React
- Валідація даних через Zod
- Middleware для захисту роутів

## Продуктивність

- Server Components для статичного контенту
- React Query для кешування API запитів
- Оптимізація зображень через next/image
- Code splitting через Next.js
- Lazy loading компонентів

## Майбутні покращення

### Функціонал
- [ ] Онлайн бросок дайсів з історією
- [ ] Повноцінна система персонажів
- [ ] Інвентар та торговці
- [ ] Довідник заклинань та бестіарій
- [ ] Інтерактивні карти
- [ ] Real-time чат через WebSockets
- [ ] Нотифікації
- [ ] Пошук та фільтрація

### Технічні
- [ ] Unit та E2E тести
- [ ] CI/CD pipeline
- [ ] Monitoring та logging
- [ ] Rate limiting
- [ ] Backup стратегія
- [ ] Міграції даних
- [ ] Internationalization (i18n)
- [ ] PWA підтримка

## Deployment

Рекомендовані платформи:
- **Vercel** - для Next.js додатку
- **Supabase/Railway/Neon** - для PostgreSQL
- **Cloudinary** - для зображень (майбутнє)

## Ліцензія

MIT
