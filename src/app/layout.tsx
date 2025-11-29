import type { Metadata } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });

export const metadata: Metadata = {
  title: 'Vohnisca - D&D Campaign Manager',
  description: 'Площадка для ведення кампаній Dungeons & Dragons',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} font-sans bg-background text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
