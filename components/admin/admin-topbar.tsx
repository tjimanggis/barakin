'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, LogOut, BookOpen, FileText, FolderOpen, Users, UserCog, HelpCircle, LayoutDashboard, Scroll, Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/lessons', label: 'Materi', icon: BookOpen },
  { href: '/admin/articles', label: 'Artikel', icon: FileText },
  { href: '/admin/categories', label: 'Kategori', icon: FolderOpen },
  { href: '/admin/tashrif', label: 'Tashrif', icon: Scroll },
  { href: '/admin/kosakata', label: 'Kosakata', icon: Tag },
  { href: '/admin/quizzes', label: 'Kuis', icon: HelpCircle },
  { href: '/admin/authors', label: 'Author', icon: UserCog, adminOnly: true },
  { href: '/admin/users', label: 'Pengguna', icon: Users, adminOnly: true },
];

interface AdminTopbarProps {
  profile: Profile | null;
  pageTitle?: string;
}

export function AdminTopbar({ profile, pageTitle }: AdminTopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {pageTitle && (
          <h1 className="text-base font-semibold text-slate-900 md:text-lg">{pageTitle}</h1>
        )}
      </div>

      {/* Right: avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-sm text-slate-600">{profile?.display_name ?? 'Admin'}</span>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 capitalize text-xs">
            {profile?.role}
          </Badge>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="flex h-16 flex-row items-center gap-3 border-b border-slate-200 px-6">
            <Image src="/favicon.png" alt="Barakin" width={32} height={32} className="rounded" />
            <SheetTitle className="text-base font-bold text-slate-900">
              Barakin Admin
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 px-3 py-4">
            <ul className="space-y-1">
              {navItems
                .filter((item) => !(item.adminOnly && profile?.role !== 'admin'))
                .map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <item.icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-slate-400')} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>
          <div className="border-t border-slate-200 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-slate-500 hover:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
