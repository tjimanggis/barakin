'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Lesson, Category } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { HarakatToggle } from '@/components/arabic/harakat-toggle';
import { TasrifTable } from '@/components/arabic/tasrif-table';
import { ArabicAudioButton } from '@/components/arabic/audio-makhraj-player';

const levelColors: Record<string, string> = {
  pemula:   'bg-blue-50 text-blue-700 border-blue-200',
  menengah: 'bg-amber-50 text-amber-700 border-amber-200',
  mahir:    'bg-rose-50 text-rose-700 border-rose-200',
};
const levelLabel: Record<string, string> = {
  pemula: 'Pemula', menengah: 'Menengah', mahir: 'Mahir',
};

export default function BelajarDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [related, setRelated] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (!data) { setNotFoundFlag(true); setLoading(false); return; }
      setLesson(data as Lesson);

      if (data.category_id) {
        const { data: cat } = await supabase
          .from('categories').select('*').eq('id', data.category_id).maybeSingle();
        if (cat) setCategory(cat as Category);
      }

      const { data: rel } = await supabase
        .from('lessons')
        .select('id, title, slug, level, description')
        .eq('published', true)
        .eq('level', data.level)
        .neq('id', data.id)
        .order('order_index')
        .limit(4);
      if (rel) setRelated(rel as Lesson[]);

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (notFoundFlag || !lesson) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <BookOpen className="h-12 w-12 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900">Materi tidak ditemukan</h1>
        <p className="text-slate-500">Materi ini mungkin belum dipublikasikan atau tidak ada.</p>
        <Button asChild variant="outline">
          <Link href="/belajar"><ArrowLeft className="mr-2 h-4 w-4" />Kembali ke Daftar Materi</Link>
        </Button>
      </div>
    );
  }

  const hasVoweled = !!lesson.content_voweled;
  const hasPlain   = !!lesson.content_plain;
  const hasBoth    = hasVoweled && hasPlain;

  // Determine whether this is a Sharaf/conjugation lesson
  const isSharafLesson =
    category?.name?.toLowerCase().includes('sharaf') ||
    lesson.title?.toLowerCase().includes('tasrif') ||
    lesson.title?.toLowerCase().includes('sharaf');

  // Extract first Arabic word from title for audio demo
  const titleWords = (lesson.content_voweled ?? lesson.title ?? '')
    .split(/\s+/)
    .filter((w) => /[\u0600-\u06FF]/.test(w));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-prose mx-auto px-4 py-10">
          <Link
            href="/belajar"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Materi
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${levelColors[lesson.level]} text-xs`}>{levelLabel[lesson.level]}</Badge>
            {category && <Badge variant="secondary" className="text-xs">{category.name}</Badge>}
          </div>

          {/* Title with audio button */}
          <div className="mt-4 flex items-start gap-3">
            <h1 className="flex-1 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
              {lesson.title}
            </h1>
            {titleWords[0] && (
              <ArabicAudioButton word={titleWords[0]} size="md" className="mt-1 flex-shrink-0" />
            )}
          </div>

          {lesson.description && (
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">{lesson.description}</p>
          )}
        </div>
      </section>

      {/* Main content */}
      <div className="container-prose mx-auto px-4 py-10 space-y-10">

        {/* ── Harakat Toggle (shown when content exists) ── */}
        {(hasVoweled || hasPlain) ? (
          hasBoth ? (
            /* Both modes — use full HarakatToggle with per-char animation */
            <HarakatToggle
              voweled={lesson.content_voweled!}
              plain={lesson.content_plain ?? undefined}
            />
          ) : (
            /* Only one mode — simple render */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              {(lesson.content_voweled ?? lesson.content_plain ?? '').split('\n').map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />;
                const isArabic = /[\u0600-\u06FF]/.test(line);
                return (
                  <div key={i} className={isArabic ? 'flex items-center justify-end gap-2 my-5' : ''}>
                    {isArabic && <ArabicAudioButton word={line.trim().split(/\s+/)[0]} size="sm" />}
                    <p
                      dir={isArabic ? 'rtl' : 'ltr'}
                      className={isArabic
                        ? 'text-right text-slate-800'
                        : 'my-3 text-base leading-relaxed text-slate-700'}
                      style={isArabic
                        ? { fontFamily: 'var(--font-arabic)', fontSize: '1.7rem', lineHeight: '3' }
                        : undefined}
                    >
                      {line}
                    </p>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">
            Konten materi belum tersedia.
          </div>
        )}

        {/* ── Tasrif Table (shown for Sharaf lessons) ── */}
        {isSharafLesson && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-base">
                  🔄
                </span>
                <h2 className="text-xl font-bold text-slate-900">Tabel Tasrif Interaktif</h2>
              </div>
              <p className="text-sm text-slate-500">
                Pilih bab dan bentuk waktu. Huruf akar (root) ditampilkan dengan warna biru.
              </p>
              <TasrifTable />
            </div>
          </>
        )}

        <Separator />

        {/* Related lessons */}
        {related.length > 0 && (
          <div>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              Materi Lainnya — Level {levelLabel[lesson.level]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/belajar/${rel.slug}`}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 group-hover:text-blue-600 line-clamp-1">{rel.title}</p>
                    {rel.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{rel.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div>
          <Button asChild variant="outline">
            <Link href="/belajar">
              <ArrowLeft className="mr-2 h-4 w-4" />Semua Materi
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
