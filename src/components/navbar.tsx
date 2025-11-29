'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Users, Scroll, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface NavbarProps {
  user?: {
    name: string | null;
    email: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Костер', icon: Flame },
    { href: '/companies', label: 'Компании', icon: Users },
    { href: '/characters', label: 'Персонажи', icon: Scroll },
  ];

  return (
    <nav className="border-b border-primary/20 bg-background-secondary/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-accent-fire" />
              <span className="text-xl font-fantasy text-primary">Vohnisca</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-400 hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.name || user.email}
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button variant="outline" size="sm" type="submit">
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Войти
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Регистрация</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
