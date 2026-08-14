import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';

const footerLinks = [
  {
    heading: 'Belajar',
    links: [
      { href: '/belajar', label: 'Semua Materi' },
      { href: '/kamus', label: 'Kamus Akar' },
      { href: '/artikel', label: 'Artikel' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { href: '/', label: 'Beranda' },
      { href: '/tentang', label: 'Tentang Kami' },
      { href: '/register', label: 'Daftar Gratis' },
    ],
  },
  {
    heading: 'Akun',
    links: [
      { href: '/login', label: 'Masuk' },
      { href: '/dashboard', label: 'Dashboard Saya' },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-wide py-14">
        {/* Top row */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/favicon.png" alt="Barakin" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold text-slate-900">Barakin</span>
            </Link>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Platform pembelajaran bahasa Arab modern untuk penutur bahasa Indonesia.
              Pelajari Nahwu, Sharaf, dan Mufrodat secara gratis.
            </p>
            {/* Arabic tagline */}
            <p
              className="mt-4 text-right text-base text-slate-400"
              dir="rtl"
              style={{ fontFamily: 'var(--font-arabic)' }}
            >
              تَعَلَّمْ وَعَلِّمْ
            </p>
          </div>

          {/* Nav columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-blue-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            &copy; {year} Barakin &mdash; barakin.id. Hak cipta dilindungi.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            Dibuat dengan <Heart className="h-3.5 w-3.5 text-rose-400" /> untuk
            para pelajar bahasa Arab Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
