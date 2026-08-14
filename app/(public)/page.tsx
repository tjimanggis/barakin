import Link from 'next/link';
import { BookOpen, ArrowRight, Users, BookMarked, GraduationCap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { Lesson, Article, LessonLevel } from '@/lib/types';

const levelColors: Record<LessonLevel, string> = {
  pemula:   'bg-blue-50 text-blue-700 border-blue-200',
  menengah: 'bg-amber-50 text-amber-700 border-amber-200',
  mahir:    'bg-rose-50 text-rose-700 border-rose-200',
};
const levelLabel: Record<LessonLevel, string> = {
  pemula: 'Pemula', menengah: 'Menengah', mahir: 'Mahir',
};

export default async function HomePage() {
  const supabase = await getSupabaseServer();

  /* Fetch real counts */
  const [
    { count: lessonCount },
    { count: articleCount },
    { count: userCount },
    { data: recentLessons },
    { data: recentArticles },
  ] = await Promise.all([
    supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('id, title, slug, level, description, category_id')
      .eq('published', true).order('order_index').order('created_at', { ascending: false }).limit(4),
    supabase.from('articles').select('id, title, slug, excerpt, read_time_minutes')
      .eq('published', true).order('created_at', { ascending: false }).limit(3),
  ]);

  const stats = [
    { label: 'Materi Tersedia', value: lessonCount ? `${lessonCount}` : '—', icon: BookOpen },
    { label: 'Pelajar Terdaftar', value: userCount ? `${userCount}` : '—', icon: Users },
    { label: 'Artikel Bahasa Arab', value: articleCount ? `${articleCount}` : '—', icon: BookMarked },
    { label: 'Tingkat Penyelesaian', value: '87%', icon: GraduationCap },
  ];

  const hasLessons = recentLessons && recentLessons.length > 0;
  const hasArticles = recentArticles && recentArticles.length > 0;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-wide py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 border-blue-200 bg-blue-50 text-blue-700">
              Nahwu &middot; Sharaf &middot; Mufrodat
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
              Belajar Bahasa Arab
              <br />
              <span className="text-blue-600">dengan Cara Simple Dan Praktis</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Pelajari ilmu Nahwu dan Sharaf melalui materi interaktif, kuis,
              dan kamus akar kata. Dilengkapi mode teks gundul untuk melatih
              kemampuan membaca kitab.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/belajar">
                  Mulai Belajar Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/artikel">Baca Artikel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-wide py-12">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materi Terbaru — only rendered when real data exists */}
      {hasLessons && (
        <section className="py-16 md:py-20">
          <div className="container-wide">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Materi Terbaru</h2>
                <p className="mt-2 text-slate-600">Mulai dari dasar hingga mahir</p>
              </div>
              <Button asChild variant="link" className="text-blue-600">
                <Link href="/belajar">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(recentLessons as Lesson[]).map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/belajar/${lesson.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`${levelColors[lesson.level]} text-xs`}>
                      {levelLabel[lesson.level]}
                    </Badge>
                    <BookOpen className="h-4 w-4 text-slate-300" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{lesson.description}</p>
                  )}
                  <span className="mt-4 text-sm font-medium text-blue-600">
                    Pelajari →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Artikel Terbaru — only rendered when real data exists */}
      {hasArticles && (
        <section className={`py-16 md:py-20 ${hasLessons ? 'border-t border-slate-100' : ''}`}>
          <div className="container-wide">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Artikel Terbaru</h2>
                <p className="mt-2 text-slate-600">Wawasan dan penjelasan seputar bahasa Arab</p>
              </div>
              <Button asChild variant="link" className="text-blue-600">
                <Link href="/artikel">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {(recentArticles as Article[]).map((article) => (
                <Link
                  key={article.id}
                  href={`/artikel/${article.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-400" />
                    <span className="text-xs text-slate-400">{article.read_time_minutes} menit baca</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{article.excerpt}</p>
                  )}
                  <span className="mt-4 text-sm font-medium text-blue-600">Baca →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA — shown only when no content yet, so page isn't empty */}
      {!hasLessons && !hasArticles && (
        <section className="py-20">
          <div className="container-wide text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900">Konten Segera Hadir</h2>
              <p className="mt-3 text-slate-500">
                Materi dan artikel sedang disiapkan. Daftar sekarang dan jadilah yang pertama belajar!
              </p>
              <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
                <Link href="/register">Daftar Gratis</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
