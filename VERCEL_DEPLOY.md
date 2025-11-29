# Деплой на Vercel

## Шаги для деплоя:

1. **Зарегистрируйся на Vercel**
   - Перейди на https://vercel.com
   - Войди через GitHub

2. **Импортируй проект**
   - Нажми "Add New Project"
   - Выбери репозиторий `testVohnisca`

3. **Настрой переменные окружения**
   
   В разделе Environment Variables добавь:

   ```
   DATABASE_URL=file:./dev.db
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here-generate-random-string
   
   # Опционально для OAuth:
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   ```

4. **Генерация NEXTAUTH_SECRET**
   
   Выполни в терминале:
   ```bash
   openssl rand -base64 32
   ```
   
   Или используй онлайн генератор: https://generate-secret.vercel.app/32

5. **База данных для продакшена**
   
   SQLite не работает на Vercel. Используй один из вариантов:
   
   - **Vercel Postgres** (рекомендуется)
   - **PlanetScale** (MySQL)
   - **Supabase** (PostgreSQL)
   - **Railway** (PostgreSQL)

   Для Vercel Postgres:
   ```bash
   # В настройках проекта на Vercel:
   Storage → Create Database → Postgres
   ```

6. **Обновление schema.prisma для PostgreSQL**
   
   Если используешь PostgreSQL, измени в `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // вместо "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

7. **Deploy**
   - Нажми "Deploy"
   - Vercel автоматически соберёт и задеплоит проект

## Важные замечания:

- SQLite не поддерживается на Vercel (файловая система read-only)
- Используй PostgreSQL или MySQL для продакшена
- После первого деплоя выполни миграции БД через Vercel CLI или панель управления
- Изображения в base64 будут работать, но лучше использовать Cloudinary/S3

## Быстрый старт с Vercel Postgres:

1. Создай Postgres БД в Vercel
2. Скопируй DATABASE_URL из настроек
3. Обнови `prisma/schema.prisma` на `provider = "postgresql"`
4. Задеплой проект
5. Выполни миграции через Vercel CLI:
   ```bash
   vercel env pull .env.local
   npx prisma db push
   ```

## Проблемы и решения:

**Ошибка сборки TypeScript:**
- Проверь все импорты
- Убедись что все типы правильные

**Ошибка базы данных:**
- Проверь DATABASE_URL
- Убедись что используешь PostgreSQL, а не SQLite

**Ошибка NextAuth:**
- Проверь NEXTAUTH_URL (должен быть твой домен Vercel)
- Проверь NEXTAUTH_SECRET (должен быть сгенерирован)
