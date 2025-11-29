import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { Navbar } from '@/components/navbar';
import { Campfire } from '@/components/campfire';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Scroll, Sword, BookOpen } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <Navbar user={session?.user} />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-fantasy text-primary mb-4">
            Добро пожаловать в Vohnisca
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Место, где герои собираются у костра, делятся историями и готовятся к новым
            приключениям
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <Campfire />
        </div>

        {session ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Link href="/companies">
              <div className="group p-6 rounded-lg border border-primary/20 bg-background-secondary hover:bg-background-tertiary hover:border-primary/40 transition-all cursor-pointer">
                <Users className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-fantasy text-primary mb-2">Мои компании</h3>
                <p className="text-gray-400 text-sm">
                  Просматривайте и управляйте своими кампаниями
                </p>
              </div>
            </Link>

            <Link href="/characters">
              <div className="group p-6 rounded-lg border border-primary/20 bg-background-secondary hover:bg-background-tertiary hover:border-primary/40 transition-all cursor-pointer">
                <Scroll className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-fantasy text-primary mb-2">Персонажи</h3>
                <p className="text-gray-400 text-sm">Создавайте и развивайте своих героев</p>
              </div>
            </Link>

            <Link href="/dice">
              <div className="group p-6 rounded-lg border border-primary/20 bg-background-secondary hover:bg-background-tertiary hover:border-primary/40 transition-all cursor-pointer">
                <Sword className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-fantasy text-primary mb-2">Броски кубиков</h3>
                <p className="text-gray-400 text-sm">Онлайн система бросков дайсов</p>
              </div>
            </Link>

            <Link href="/reference">
              <div className="group p-6 rounded-lg border border-primary/20 bg-background-secondary hover:bg-background-tertiary hover:border-primary/40 transition-all cursor-pointer">
                <BookOpen className="h-12 w-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-fantasy text-primary mb-2">Справочник</h3>
                <p className="text-gray-400 text-sm">Заклинания, существа и правила</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="text-center max-w-md mx-auto">
            <p className="text-gray-400 mb-6">
              Войдите или зарегистрируйтесь, чтобы начать свое приключение
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signin">
                <Button variant="outline" size="lg">
                  Войти
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg">Регистрация</Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-primary/20 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Vohnisca © 2024 - Платформа для D&D кампаний</p>
        </div>
      </footer>
    </div>
  );
}
