import { getSupabaseServer } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Bookmark, Clock, Heart } from 'lucide-react';

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
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id);

  const bookmarks = progress?.filter((p: any) => p.bookmarked) || [];
  const completed = progress?.filter((p: any) => p.status === 'completed') || [];

  return (
    <div className="container-wide py-12 space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
        <h1 className="text-3xl font-bold">
          Ahlan wa Sahlan, {profile?.display_name || 'Pelajar'}
        </h1>
        <p className="mt-2 text-blue-100">Selamat datang kembali, mari lanjutkan petualangan ilmu Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
            { title: 'Progres Belajar', value: `${completed.length} Materi`, icon: BookOpen },
            { title: 'Bookmark', value: `${bookmarks.length}`, icon: Bookmark },
            { title: 'Suka', value: '-', icon: Heart },
            { title: 'Waktu Belajar', value: '-', icon: Clock },
        ].map((item, i) => (
            <Card key={i} className="hover:border-blue-300 transition-all hover:shadow-md hover:shadow-blue-100 duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{item.value}</div>
            </CardContent>
            </Card>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 border-l-4 border-blue-500 pl-3">Aktivitas Terakhir</h2>
        {progress && progress.length > 0 ? (
          <ul className="space-y-4">
            {progress.sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()).slice(0, 5).map((p: any) => (
              <li key={p.id} className="text-sm text-slate-600 flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors">
                <span>Materi {p.lesson_id}</span>
                <span className="text-slate-400 font-mono text-xs">Terakhir: {new Date(p.last_accessed_at).toLocaleDateString()}</span>
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
