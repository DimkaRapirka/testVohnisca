# Інструкція з налаштування Vohnisca

## Швидкий старт

### 1. Встановлення залежностей

\`\`\`bash
npm install
\`\`\`

### 2. Налаштування бази даних

Вам потрібна PostgreSQL база даних. Варіанти:

#### Локальна PostgreSQL
\`\`\`bash
# Встановіть PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: завантажте з postgresql.org

# Створіть базу даних
createdb vohnisca
\`\`\`

#### Або використайте хмарний сервіс
- [Supabase](https://supabase.com) - безкоштовний tier
- [Railway](https://railway.app) - безкоштовний tier
- [Neon](https://neon.tech) - безкоштовний tier

### 3. Налаштування змінних оточення

\`\`\`bash
cp .env.example .env
\`\`\`

Відредагуйте `.env`:

\`\`\`env
# Ваш PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/vohnisca?schema=public"

# Згенеруйте секрет для NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="згенеруйте-за-допомогою-openssl-rand-base64-32"

# Опціонально: OAuth провайдери
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
\`\`\`

Згенеруйте NEXTAUTH_SECRET:
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 4. Ініціалізація бази даних

\`\`\`bash
npm run db:push
\`\`\`

Ця команда створить всі необхідні таблиці в базі даних.

### 5. Запуск проекту

\`\`\`bash
npm run dev
\`\`\`

Відкрийте [http://localhost:3000](http://localhost:3000)

## Налаштування OAuth (опціонально)

### Google OAuth

1. Перейдіть до [Google Cloud Console](https://console.cloud.google.com)
2. Створіть новий проект або виберіть існуючий
3. Увімкніть Google+ API
4. Створіть OAuth 2.0 Client ID:
   - Authorized redirect URIs: \`http://localhost:3000/api/auth/callback/google\`
5. Скопіюйте Client ID та Client Secret в `.env`

### Discord OAuth

1. Перейдіть до [Discord Developer Portal](https://discord.com/developers/applications)
2. Створіть New Application
3. В розділі OAuth2:
   - Redirects: \`http://localhost:3000/api/auth/callback/discord\`
4. Скопіюйте Client ID та Client Secret в `.env`

## Корисні команди

\`\`\`bash
# Розробка
npm run dev              # Запустити dev сервер

# База даних
npm run db:push          # Синхронізувати схему з БД
npm run db:studio        # Відкрити Prisma Studio (GUI для БД)
npm run db:generate      # Згенерувати Prisma Client

# Production
npm run build            # Зібрати проект
npm run start            # Запустити production сервер

# Якість коду
npm run lint             # Перевірити код
\`\`\`

## Перевірка роботи

1. Зареєструйте новий обліковий запис на `/auth/signup`
2. Створіть нову компанію
3. Додайте енкаунтер до компанії
4. Створіть замітку в енкаунтері

## Troubleshooting

### Помилка підключення до БД
- Перевірте, чи запущена PostgreSQL
- Перевірте правильність DATABASE_URL в `.env`
- Переконайтесь, що база даних існує

### Помилка авторизації
- Перевірте, чи встановлений NEXTAUTH_SECRET
- Очистіть cookies браузера
- Перезапустіть dev сервер

### Prisma помилки
\`\`\`bash
# Очистіть та перегенеруйте
rm -rf node_modules/.prisma
npm run db:generate
npm run db:push
\`\`\`

## Наступні кроки

Після успішного запуску ви можете:
- Додати більше користувачів
- Створити кілька компаній
- Експериментувати з різними типами заміток
- Налаштувати OAuth провайдери

Для production deployment дивіться документацію:
- [Vercel](https://vercel.com/docs)
- [Railway](https://docs.railway.app)
- [Render](https://render.com/docs)
