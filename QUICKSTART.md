# Швидкий старт Vohnisca

## 5 хвилин до запуску

### 1. Клонування та встановлення (1 хв)

\`\`\`bash
git clone <repository-url>
cd vohnisca
npm install
\`\`\`

### 2. База даних (2 хв)

**Варіант A: Локальна PostgreSQL**
\`\`\`bash
# Якщо PostgreSQL вже встановлена
createdb vohnisca
\`\`\`

**Варіант B: Безкоштовна хмарна БД (рекомендовано)**

Зареєструйтесь на [Supabase](https://supabase.com):
1. Create new project
2. Скопіюйте Connection String (URI)

### 3. Конфігурація (1 хв)

\`\`\`bash
cp .env.example .env
\`\`\`

Відредагуйте `.env`:
\`\`\`env
DATABASE_URL="postgresql://..." # Ваш connection string
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="будь-який-довгий-рандомний-рядок"
\`\`\`

Швидко згенерувати секрет:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

### 4. Ініціалізація БД (30 сек)

\`\`\`bash
npm run db:push
\`\`\`

### 5. Запуск (30 сек)

\`\`\`bash
npm run dev
\`\`\`

Відкрийте [http://localhost:3000](http://localhost:3000) 🎉

## Перші кроки

1. **Реєстрація**: Перейдіть на `/auth/signup`
2. **Створіть компанію**: Натисніть "Створити компанію"
3. **Додайте енкаунтер**: В компанії натисніть "Створити енкаунтер"
4. **Додайте замітку**: В енкаунтері натисніть "Додати замітку"

## Корисні команди

\`\`\`bash
npm run dev          # Запустити dev сервер
npm run db:studio    # Відкрити Prisma Studio (GUI для БД)
npm run lint         # Перевірити код
\`\`\`

## Структура для розробки

\`\`\`
src/
├── app/              # Сторінки та API routes
├── components/       # Переиспользуемые UI компоненти
├── features/         # Доменні модулі (companies, encounters, notes)
├── lib/              # Утиліти
└── types/            # TypeScript типи
\`\`\`

## Додавання нового функціоналу

### Приклад: Додати нову сторінку

1. Створіть файл `src/app/my-page/page.tsx`:
\`\`\`tsx
'use client';

import { Navbar } from '@/components/navbar';
import { useSession } from 'next-auth/react';

export default function MyPage() {
  const { data: session } = useSession();
  
  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-fantasy text-primary">
          Моя сторінка
        </h1>
      </main>
    </div>
  );
}
\`\`\`

2. Додайте посилання в navbar (`src/components/navbar.tsx`)

### Приклад: Додати API endpoint

1. Створіть `src/app/api/my-endpoint/route.ts`:
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ваша логіка
  const data = await prisma.yourModel.findMany();
  
  return NextResponse.json(data);
}
\`\`\`

### Приклад: Додати нову таблицю в БД

1. Відредагуйте `prisma/schema.prisma`:
\`\`\`prisma
model MyNewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  
  @@map("my_new_models")
}
\`\`\`

2. Синхронізуйте з БД:
\`\`\`bash
npm run db:push
\`\`\`

## Troubleshooting

### Не можу підключитись до БД
\`\`\`bash
# Перевірте connection string
echo $DATABASE_URL

# Перевірте, чи запущена PostgreSQL (локально)
pg_isready
\`\`\`

### Помилки TypeScript
\`\`\`bash
# Перегенеруйте Prisma Client
npm run db:generate
\`\`\`

### Помилки авторизації
\`\`\`bash
# Очистіть cookies та перезапустіть
rm -rf .next
npm run dev
\`\`\`

## Наступні кроки

- 📖 Прочитайте [README.md](README.md) для повного огляду
- 🏗️ Вивчіть [ARCHITECTURE.md](ARCHITECTURE.md) для розуміння структури
- ⚙️ Детальне налаштування в [SETUP.md](SETUP.md)

## Потрібна допомога?

- Перевірте документацію в репозиторії
- Створіть issue на GitHub
- Перегляньте код - він добре задокументований

Приємної розробки! 🔥
