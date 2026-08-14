'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  FolderOpen,
  Users,
  UserCog,
  HelpCircle,
  LogOut,
  ChevronRight,
  BookMarked,
  Scroll,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/lessons',
    label: 'Materi',
    icon: BookOpen,
  },
  {
    href: '/admin/articles',
    label: 'Artikel',
    icon: FileText,
  },
  {
    href: '/admin/categories',
    label: 'Kategori',
    icon: FolderOpen,
  },
  {
    href: '/admin/tashrif',
    label: 'Tashrif',
    icon: Scroll,
  },
  {
    href: '/admin/kosakata',
    label: 'Kosakata',
    icon: Tag,
  },
  {
    href: '/admin/quizzes',
    label: 'Kuis',
    icon: HelpCircle,
  },
  {
    href: '/admin/authors',
    label: 'Author',
    icon: UserCog,
    adminOnly: true,
  },
  {
    href: '/admin/users',
    label: 'Pengguna',
    icon: Users,
    adminOnly: true,
  },
];

interface AdminSidebarProps {
  profile: Profile | null;
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BookMarked className="h-4 w-4" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-900">Barakin</span>
          <Badge
            variant="secondary"
            className="ml-2 bg-blue-50 text-blue-700 text-[10px] py-0 px-1.5"
          >
            Admin
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-blue-600' : 'text-slate-400',
                      )}
                    />
                    {item.label}
                    {isActive && (
                      <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* User Profile + Sign Out */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {profile?.display_name ?? 'Admin'}
            </p>
            <p className="text-xs capitalize text-slate-400">{profile?.role ?? 'author'}</p>
          </div>
        </div>
        <Separator className="my-2" />
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
    </aside>
  );
}
