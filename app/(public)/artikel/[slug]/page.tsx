import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseServer } from '@/lib/supabase/server';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Metadata } from 'next';

/* ------------------------------------------------------------------ */
/* Generate metadata for SEO                                            */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('articles')
    .select('title, excerpt')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();

  if (!data) return { title: 'Artikel tidak ditemukan' };

  return {
    title: `${data.title} — Barakin`,
    description: data.excerpt ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default async function ArtikelDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await getSupabaseServer();

  /* Fetch article */
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();

  if (!article) notFound();

  /* Fetch author profile */
  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', article.author_id)
    .maybeSingle();

  /* Fetch category */
  const { data: category } = article.category_id
    ? await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', article.category_id)
        .maybeSingle()
    : { data: null };

  /* Fetch related articles (same category, exclude current) */
  const { data: related } = article.category_id
    ? await supabase
        .from('articles')
        .select('id, title, slug, excerpt, read_time_minutes, created_at')
        .eq('published', true)
        .eq('category_id', article.category_id)
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(3)
    : { data: [] };

  const publishedDate = format(new Date(article.created_at), 'd MMMM yyyy', {
    locale: localeId,
  });

  return (
    <div className="flex flex-col">
      {/* Cover image */}
      {article.cover_image_url && (
        <div className="relative h-56 w-full overflow-hidden bg-slate-200 md:h-80">
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Content area */}
      <div className="container-prose mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href="/artikel"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Artikel
        </Link>

        {/* Category badge */}
        {category && (
          <div className="mb-4">
            <Link href={`/artikel?kategori=${category.slug}`}>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {category.name}
              </Badge>
            </Link>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
          {article.title}
        </h1>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {author?.display_name ?? 'Tim Barakin'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {publishedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {article.read_time_minutes} menit baca
          </span>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        {/* Excerpt / Lead */}
        {article.excerpt && (
          <p className="mb-8 text-lg font-medium leading-relaxed text-slate-700">
            {article.excerpt}
          </p>
        )}

        {/* Main content */}
        {article.content ? (
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900">
            {article.content.split('\n').map((paragraph: string, i: number) => {
              if (!paragraph.trim()) return null;
              // Detect Arabic text (contains Arabic Unicode block chars)
              const hasArabic = /[\u0600-\u06FF]/.test(paragraph);
              return (
                <p
                  key={i}
                  dir={hasArabic ? 'rtl' : 'ltr'}
                  className={
                    hasArabic
                      ? 'arabic-text my-6 text-center text-slate-800'
                      : 'my-4 text-slate-700'
                  }
                  style={hasArabic ? { fontFamily: 'var(--font-arabic)' } : undefined}
                >
                  {paragraph}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 italic">Konten artikel belum tersedia.</p>
        )}

        <Separator className="my-10" />

        {/* Related articles */}
        {related && related.length > 0 && (
          <div>
            <h2 className="mb-6 text-xl font-bold text-slate-900">
              Artikel Terkait
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/artikel/${rel.slug}`}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600">
                    {rel.title}
                  </h3>
                  {rel.excerpt && (
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">
                      {rel.excerpt}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    {rel.read_time_minutes} menit baca
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-12">
          <Button asChild variant="outline">
            <Link href="/artikel">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Semua Artikel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
