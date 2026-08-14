import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Amiri } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const arabic = Amiri({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Barakin - Belajar Bahasa Arab Modern',
  description:
    'Platform pembelajaran bahasa Arab modern. Pelajari Nahwu, Sharaf, dan Mufrodat dengan materi interaktif, kuis, dan kamus akar kata.',
   icons: {
    icon: 'favicon.png',  // atau '/favicon.ico' sesuai file yang kamu rename
    apple: '/icon.png',
  },
    openGraph: {
    title: 'Barakin - Belajar Bahasa Arab Modern',
    description:
      'Platform pembelajaran bahasa Arab modern. Pelajari Nahwu, Sharaf, dan Mufrodat dengan materi interaktif.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${arabic.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
