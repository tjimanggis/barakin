import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import type { Profile } from '@/lib/types';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role;

  if (role !== 'admin' && role !== 'author') {
    redirect('/');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar – desktop only */}
      <div className="hidden md:block">
        <AdminSidebar profile={profile as Profile | null} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar (shows mobile menu button + page title + avatar) */}
        <AdminTopbar profile={profile as Profile | null} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
