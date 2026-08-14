'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioMakhrajPlayer } from '@/components/arabic/audio-makhraj-player';
import { TasrifTable } from '@/components/arabic/tasrif-table';
import { HarakatToggle } from '@/components/arabic/harakat-toggle';
import { Volume2, TableProperties, BookOpen, Loader2 } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Kosakata, Tashrif } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/* ── Sample harakat text for the toggle demo ── */
const DEMO_TEXT = `بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ
الْعِلْمُ نُورٌ وَالْجَهْلُ ظُلْمَةٌ
مَنْ طَلَبَ الْعِلْمَ فَقَدْ طَلَبَ طَرِيقَ الْجَنَّةِ`;

const DEMO_TEXT_PLAIN = `بسم الله الرحمن الرحيم
العلم نور والجهل ظلمة
من طلب العلم فقد طلب طريق الجنة`;

const WORD_TYPE_LABELS: Record<string, string> = {
  noun: 'Kata Benda',
  verb: 'Kata Kerja',
  adjective: 'Kata Sifat',
  adverb: 'Kata Keterangan',
  preposition: 'Kata Depan',
  other: 'Lainnya',
};

export default function KamusPage() {
  const [kosakata, setKosakata] = useState<Kosakata[]>([]);
  const [tashrif, setTashrif] = useState<Tashrif[]>([]);
  const [loadingKosakata, setLoadingKosakata] = useState(true);
  const [loadingTashrif, setLoadingTashrif] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = getSupabaseBrowser();
      
      // Fetch kosakata
      const { data: kosData } = await supabase
        .from('kosakata')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (kosData) setKosakata(kosData as Kosakata[]);
      setLoadingKosakata(false);

      // Fetch tashrif
      const { data: tasData } = await supabase
        .from('tashrif')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      
      if (tasData) setTashrif(tasData as Tashrif[]);
      setLoadingTashrif(false);
    };

    fetchData();
  }, []);
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Kamus &amp; Alat Belajar
          </h1>
          <p className="mt-2 text-slate-600">
            Kosakata, tabel tasrif interaktif, dan latihan baca harakat
          </p>
        </div>
      </section>

      {/* Tabbed tools */}
      <section className="py-10">
        <div className="container-wide">
          <Tabs defaultValue="mufrodat" className="space-y-6">
            <TabsList className="h-10 w-full justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="mufrodat" className="gap-2">
                <Volume2 className="h-4 w-4" />
                🔊 Kosakata &amp; Audio
              </TabsTrigger>
              <TabsTrigger value="tasrif" className="gap-2">
                <TableProperties className="h-4 w-4" />
                🔄 Tabel Tasrif
              </TabsTrigger>
              <TabsTrigger value="harakat" className="gap-2">
                <BookOpen className="h-4 w-4" />
                🔀 Latihan Harakat
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Kosakata Database ── */}
            <TabsContent value="mufrodat" className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-4">
                <p className="text-sm font-medium text-blue-800">
                  📚 Kosakata & Mufrodat
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Koleksi kosakata bahasa Arab beserta arti dan contoh kalimat
                </p>
              </div>
              {loadingKosakata ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </div>
              ) : kosakata.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  Kosakata akan tersedia segera. Kembali lagi nanti! 📚
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {kosakata.map((item) => (
                    <Card key={item.id} className="border-slate-200">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="capitalize">
                            {item.level}
                          </Badge>
                          {item.word_type && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {WORD_TYPE_LABELS[item.word_type] || item.word_type}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Kata Arab</p>
                          <h3 className="text-2xl font-arabic font-bold text-slate-900">
                            {item.arabic_harakat || item.arabic_text}
                          </h3>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-500">Arti</p>
                          <p className="font-semibold text-slate-900">{item.indonesia_meaning}</p>
                        </div>
                        {item.example_sentence_id && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                            <span className="text-slate-500">Contoh: </span>
                            {item.example_sentence_id}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 2: Tashrif Database ── */}
            <TabsContent value="tasrif" className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-5 py-4">
                <p className="text-sm font-medium text-emerald-800">
                  🔄 Tabel Tashrif
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Koleksi tabel tashrif (conjugation) dari para pelajar
                </p>
              </div>
              {loadingTashrif ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </div>
              ) : tashrif.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  Tashrif akan tersedia segera. Kembali lagi nanti! 📚
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tashrif.map((item) => (
                    <Card key={item.id} className="border-slate-200">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="capitalize">
                            {item.level}
                          </Badge>
                          <span className="text-xs text-slate-400">Tashrif</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {item.title}
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {item.base_verb && (
                          <div>
                            <p className="text-xs text-slate-500">Kata Kerja Dasar</p>
                            <p className="font-arabic text-xl font-bold text-slate-900">
                              {item.base_verb}
                            </p>
                          </div>
                        )}
                        {item.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                            locale: localeId,
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Harakat Toggle Demo ── */}
            <TabsContent value="harakat" className="space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-5 py-4">
                <p className="text-sm font-medium text-violet-800">
                  🔀 Latihan Baca Harakat
                </p>
                <p className="mt-1 text-xs text-violet-600">
                  Matikan harakat untuk berlatih membaca seperti kitab gundul. Arahkan kursor
                  ke kata untuk melihat harakat sementara saat mode &quot;Tanpa Harakat&quot; aktif.
                </p>
              </div>
              <HarakatToggle
                voweled={DEMO_TEXT}
                plain={DEMO_TEXT_PLAIN}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
