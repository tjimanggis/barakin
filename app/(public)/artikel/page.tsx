'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Article } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function ArtikelPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setArticles(data as Article[]);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Artikel &amp; Wawasan
          </h1>
          <p className="mt-2 text-slate-600">
            Artikel bahasa Arab dengan insight mendalam tentang Nahwu, Sharaf, dan Mufrodat
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          {loading ? (
            <div className="text-center text-slate-500">
              Memuat artikel...
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Belum ada artikel. Kembali lagi nanti! 📖
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden border-slate-200 transition-shadow hover:shadow-lg"
                >
                  {article.cover_image_url && (
                    <div className="relative h-40 w-full overflow-hidden bg-slate-200">
                      <Image
                        src={article.cover_image_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    {article.category_id && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        Artikel
                      </Badge>
                    )}
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">
                      {article.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                      {article.excerpt || article.content}
                    </p>
                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.read_time_minutes} menit baca
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </div>
                    </div>
                    <Link
                      href={`/artikel/${article.slug}`}
                      className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Baca selengkapnya →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
