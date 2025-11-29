# Contributing to Vohnisca

Дякуємо за інтерес до розвитку Vohnisca! Цей документ містить рекомендації для контрибуторів.

## Як почати

1. Fork репозиторій
2. Клонуйте свій fork
3. Створіть нову гілку для вашої фічі
4. Зробіть зміни
5. Створіть Pull Request

## Налаштування середовища

```bash
# Клонування
git clone https://github.com/your-username/vohnisca.git
cd vohnisca

# Встановлення
npm install

# Налаштування
cp .env.example .env
# Відредагуйте .env

# Ініціалізація БД
npm run db:push

# Запуск
npm run dev
```

## Структура гілок

- `main` - стабільна версія
- `develop` - розробка
- `feature/*` - нові фічі
- `fix/*` - виправлення багів
- `docs/*` - документація

## Процес розробки

### 1. Створення гілки

```bash
# Для нової фічі
git checkout -b feature/dice-roller

# Для виправлення
git checkout -b fix/auth-bug

# Для документації
git checkout -b docs/api-documentation
```

### 2. Розробка

- Пишіть чистий, зрозумілий код
- Дотримуйтесь існуючого стилю
- Додавайте коментарі де потрібно
- Тестуйте свої зміни

### 3. Commit

Використовуйте [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Нова фіча
git commit -m "feat: add dice roller component"

# Виправлення
git commit -m "fix: resolve auth redirect issue"

# Документація
git commit -m "docs: update API documentation"

# Рефакторинг
git commit -m "refactor: simplify note filtering logic"

# Стилі
git commit -m "style: format code with prettier"

# Тести
git commit -m "test: add unit tests for dice roller"
```

### 4. Pull Request

- Опишіть що змінено та чому
- Додайте скріншоти для UI змін
- Посилайтесь на відповідні issues
- Переконайтесь що тести проходять

## Стандарти коду

### TypeScript

```typescript
// ✅ Добре
interface UserProps {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserProps> {
  // ...
}

// ❌ Погано
function getUser(id: any): any {
  // ...
}
```

### React компоненти

```typescript
// ✅ Добре
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {children}
    </button>
  );
}

// ❌ Погано
export function Button(props: any) {
  return <button {...props} />;
}
```

### API Routes

```typescript
// ✅ Добре
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await prisma.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ❌ Погано
export async function GET(req: NextRequest) {
  const data = await prisma.model.findMany();
  return NextResponse.json(data);
}
```

### Prisma моделі

```prisma
// ✅ Добре
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]

  @@map("users")
}

// ❌ Погано
model User {
  id    String @id
  email String
  posts Post[]
}
```

## Стиль коду

### Форматування

Використовуємо Prettier:

```bash
npm run format
```

### Лінтинг

Використовуємо ESLint:

```bash
npm run lint
```

### Іменування

- **Компоненти**: PascalCase (`UserProfile.tsx`)
- **Функції**: camelCase (`getUserById`)
- **Константи**: UPPER_SNAKE_CASE (`MAX_USERS`)
- **Файли**: kebab-case (`user-profile.tsx`)
- **Типи**: PascalCase (`UserProfile`)

## Тестування

### Unit тести

```typescript
import { describe, it, expect } from 'vitest';
import { rollDice } from '@/lib/utils';

describe('rollDice', () => {
  it('should return a number between 1 and sides', () => {
    const result = rollDice(20);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(20);
  });
});
```

### E2E тести

```typescript
import { test, expect } from '@playwright/test';

test('user can create a company', async ({ page }) => {
  await page.goto('/companies');
  await page.click('text=Створити компанію');
  await page.fill('input[name="name"]', 'Test Company');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Test Company')).toBeVisible();
});
```

## Документація

### JSDoc коментарі

```typescript
/**
 * Rolls a dice with the specified number of sides
 * @param sides - Number of sides on the dice
 * @param count - Number of dice to roll
 * @param modifier - Modifier to add to the result
 * @returns Object with rolls, sum, and total
 */
export function rollDice(sides: number, count: number = 1, modifier: number = 0) {
  // ...
}
```

### README для нових модулів

Якщо додаєте новий модуль, створіть README.md:

```markdown
# Module Name

Brief description

## Usage

\`\`\`typescript
import { MyComponent } from './my-component';
\`\`\`

## API

### Props

- `prop1` - description
- `prop2` - description
```

## Що контрибутити

### Пріоритетні напрямки

1. **Персонажі** - система створення та управління персонажами
2. **Дайси** - онлайн броски дайсів
3. **Інвентар** - система предметів
4. **Тести** - покриття тестами
5. **Документація** - покращення документації

### Ідеї для контрибуції

- Виправлення багів з [Issues](https://github.com/your-repo/issues)
- Реалізація фіч з [TODO.md](TODO.md)
- Покращення UI/UX
- Додавання тестів
- Оптимізація продуктивності
- Переклади (i18n)
- Документація

## Код ревю

Всі Pull Requests проходять код ревю. Очікуйте:

- Конструктивний фідбек
- Запити на зміни
- Обговорення рішень

## Питання?

- Створіть [Issue](https://github.com/your-repo/issues)
- Напишіть в [Discussions](https://github.com/your-repo/discussions)
- Зверніться до мейнтейнерів

## Кодекс поведінки

- Будьте ввічливі та поважайте інших
- Конструктивна критика
- Допомагайте новачкам
- Фокусуйтесь на коді, а не на людях

## Ліцензія

Контрибутуючи в Vohnisca, ви погоджуєтесь що ваш код буде ліцензовано під MIT License.

---

Дякуємо за ваш внесок! 🔥
