import { getSupabaseServer } from '@/lib/supabase/server';
import {
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  TrendingUp,
  Eye,
  PenSquare,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

async function getStats(supabase: Awaited<ReturnType<typeof getSupabaseServer>>) {
  const [
    { count: userCount },
    { count: lessonCount },
    { count: articleCount },
    { count: quizCount },
    { count: publishedLessons },
    { count: publishedArticles },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('published', true),
    supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('published', true),
  ]);

  return {
    userCount: userCount ?? 0,
    lessonCount: lessonCount ?? 0,
    articleCount: articleCount ?? 0,
    quizCount: quizCount ?? 0,
    publishedLessons: publishedLessons ?? 0,
    publishedArticles: publishedArticles ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServer();
  const stats = await getStats(supabase);

  // Recent lessons
  const { data: recentLessons } = await supabase
    .from('lessons')
    .select('id, title, level, published, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent articles
  const { data: recentArticles } = await supabase
    .from('articles')
    .select('id, title, published, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats.userCount,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/users',
    },
    {
      title: 'Total Materi',
      value: stats.lessonCount,
      sub: `${stats.publishedLessons} dipublikasikan`,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/admin/lessons',
    },
    {
      title: 'Total Artikel',
      value: stats.articleCount,
      sub: `${stats.publishedArticles} dipublikasikan`,
      icon: FileText,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      href: '/admin/articles',
    },
    {
      title: 'Total Kuis',
      value: stats.quizCount,
      icon: HelpCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/admin/quizzes',
    },
  ];

  const levelColors: Record<string, string> = {
    pemula: 'bg-blue-50 text-blue-700 border-blue-200',
    menengah: 'bg-amber-50 text-amber-700 border-amber-200',
    mahir: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Selamat datang di panel admin Barakin.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="border-slate-200 transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-6">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-0.5 text-3xl font-bold text-slate-900">{card.value}</p>
                  {card.sub && <p className="mt-1 text-xs text-slate-400">{card.sub}</p>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            <TrendingUp className="mr-2 inline h-4 w-4 text-blue-600" />
            Aksi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/lessons/new">
              <PenSquare className="mr-2 h-4 w-4" /> Tulis Materi Baru
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/articles/new">
              <FileText className="mr-2 h-4 w-4" /> Tulis Artikel Baru
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/categories">
              <FolderOpen className="mr-2 h-4 w-4" /> Kelola Kategori
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/users">
              <Users className="mr-2 h-4 w-4" /> Kelola Pengguna
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Lessons */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              <BookOpen className="mr-2 inline h-4 w-4 text-emerald-600" />
              Materi Terbaru
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-blue-600">
              <Link href="/admin/lessons">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {recentLessons && recentLessons.length > 0 ? (
              recentLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {lesson.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(lesson.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </p>
                  </div>
                  <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                    <Badge className={`text-xs ${levelColors[lesson.level] ?? ''}`}>
                      {lesson.level}
                    </Badge>
                    <Badge
                      variant={lesson.published ? 'default' : 'secondary'}
                      className={
                        lesson.published
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }
                    >
                      {lesson.published ? 'Publik' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Belum ada materi.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Articles */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              <FileText className="mr-2 inline h-4 w-4 text-violet-600" />
              Artikel Terbaru
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-blue-600">
              <Link href="/admin/articles">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {recentArticles && recentArticles.length > 0 ? (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {article.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(article.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </p>
                  </div>
                  <Badge
                    className={
                      article.published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ml-3 flex-shrink-0'
                        : 'bg-slate-100 text-slate-500 ml-3 flex-shrink-0'
                    }
                  >
                    {article.published ? 'Publik' : 'Draft'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Belum ada artikel.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
