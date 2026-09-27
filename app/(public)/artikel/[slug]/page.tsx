'use client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { ArrowLeft, Clock, Calendar, User, FileDown, Heart, Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ArtikelDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authorName, setAuthorName] = useState<string>('');
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: articleData } = await supabase
        .from('articles')
        .select('*')
        .filter('slug', 'eq', params.slug)
        .eq('published', true)
        .maybeSingle();

      if (!articleData) {
        notFound();
      }
      setArticle(articleData);

      // Fetch Author Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', articleData.author_id)
        .single();
      setAuthorName(profile?.display_name || 'Author');

      if (user) {
        // Check Like
        const { data: likeData } = await supabase
          .from('article_likes')
          .select('id')
          .eq('article_id', articleData.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsLiked(!!likeData);

        // Check Bookmark
        const { data: bookmarkData } = await supabase
          .from('article_bookmarks')
          .select('id')
          .eq('article_id', articleData.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsBookmarked(!!bookmarkData);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [params.slug, supabase]);

  async function toggleLike() {
    if (!user) { toast({ title: 'Perlu Login', description: 'Silakan login untuk menyukai artikel.' }); return; }
    
    if (isLiked) {
      await supabase.from('article_likes').delete().eq('article_id', article.id).eq('user_id', user.id);
      setIsLiked(false);
      toast({ title: 'Batal Suka', description: 'Artikel dihapus dari favorit.' });
    } else {
      await supabase.from('article_likes').insert({ article_id: article.id, user_id: user.id });
      setIsLiked(true);
      toast({ title: 'Disukai', description: 'Artikel ditambahkan ke favorit.' });
    }
  }

  async function toggleBookmark() {
    if (!user) { toast({ title: 'Perlu Login', description: 'Silakan login untuk membookmark artikel.' }); return; }
    
    if (isBookmarked) {
      await supabase.from('article_bookmarks').delete().eq('article_id', article.id).eq('user_id', user.id);
      setIsBookmarked(false);
      toast({ title: 'Batal Bookmark', description: 'Artikel dihapus dari bookmark.' });
    } else {
      await supabase.from('article_bookmarks').insert({ article_id: article.id, user_id: user.id });
      setIsBookmarked(true);
      toast({ title: 'Dibookmark', description: 'Artikel ditambahkan ke bookmark.' });
    }
  }

  if (loading) return <div>Loading...</div>;

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
        {/* Back link and Actions */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/artikel"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Artikel
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleLike}>
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleBookmark}>
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Category badge */}
        {article.category_id && (
          <div className="mb-4">
            <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700"
              >
                Kategori
              </Badge>
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
            {authorName}
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

        {/* File Download */}
        {article.file_url && (
          <div className="mb-8">
            <Button asChild variant="default" className="bg-blue-600">
              <a href={article.file_url} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 h-4 w-4" />
                Unduh Lampiran Dokumen
              </a>
            </Button>
          </div>
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
      </div>
    </div>
  );
}
