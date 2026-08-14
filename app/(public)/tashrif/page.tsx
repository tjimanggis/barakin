'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Tashrif } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function TasrhifPage() {
  const [tashrif, setTashrif] = useState<Tashrif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTashrif = async () => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('tashrif')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTashrif(data as Tashrif[]);
      }
      setLoading(false);
    };

    fetchTashrif();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Tashrif
          </h1>
          <p className="mt-2 text-slate-600">
            Pelajari conjugation dan perubahan bentuk kata kerja (Fiil) dalam bahasa Arab
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Memuat tashrif...
            </div>
          ) : tashrif.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500 mb-4">
                Materi tashrif akan tersedia segera. Kembali lagi nanti! 📚
              </p>
              <Link href="/belajar" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                Kembali ke Belajar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tashrif.map((item) => (
                <Card
                  key={item.id}
                  className="border-slate-200 overflow-hidden transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {item.level}
                      </Badge>
                      <span className="text-xs text-slate-400">Tashrif</span>
                    </div>
                    <CardTitle className="text-lg text-slate-900">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.base_verb && (
                      <div>
                        <p className="text-xs text-slate-500">Kata Kerja Dasar</p>
                        <p className="text-lg font-arabic font-semibold text-slate-900">
                          {item.base_verb}
                        </p>
                      </div>
                    )}
                    {item.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
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
