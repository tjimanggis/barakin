import { getSupabaseServer } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Bookmark, Clock, Heart } from 'lucide-react';
import type { UserProgress } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  
  // Fetch user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch progress
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id);
  const progress: UserProgress[] = progressData ?? [];

  const bookmarks = progress.filter((p) => p.bookmarked);
  const completed = progress.filter((p) => p.status === 'completed');

  return (
    <div className="container-wide py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Ahlan wa Sahlan, {profile?.display_name || 'Pelajar'}
        </h1>
        <p className="mt-2 text-slate-600">Selamat datang kembali di Barakin.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progres Belajar</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length} Materi</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmark</CardTitle>
            <Bookmark className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookmarks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suka</CardTitle>
            <Heart className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waktu Belajar</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Aktivitas Terakhir</h2>
        {progress && progress.length > 0 ? (
          <ul className="space-y-4">
            {progress.sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()).slice(0, 5).map((p) => (
              <li key={p.id} className="text-sm text-slate-600">
                Materi {p.lesson_id} - Terakhir diakses {new Date(p.last_accessed_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Belum ada aktivitas.</p>
        )}
      </div>
    </div>
  );
}
