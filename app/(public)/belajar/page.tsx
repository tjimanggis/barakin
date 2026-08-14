'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Lesson, Category, LessonLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BookOpen, Search, Clock, ArrowRight, Loader2 } from 'lucide-react';

const levelColors: Record<LessonLevel, string> = {
  pemula:   'bg-blue-50 text-blue-700 border-blue-200',
  menengah: 'bg-amber-50 text-amber-700 border-amber-200',
  mahir:    'bg-rose-50 text-rose-700 border-rose-200',
};
const levelLabel: Record<LessonLevel, string> = {
  pemula: 'Pemula', menengah: 'Menengah', mahir: 'Mahir',
};

export default function BelajarPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();
      const [{ data: ls }, { data: cs }] = await Promise.all([
        supabase.from('lessons').select('*').eq('published', true).order('order_index').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (ls) setLessons(ls as Lesson[]);
      if (cs) setCategories(cs as Category[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = lessons.filter((l) => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (catFilter !== 'all' && l.category_id !== catFilter) return false;
    if (search.trim() && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/40 to-white">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Modul Pelajaran</h1>
          <p className="mt-2 text-slate-600">Nahwu, Sharaf, dan Mufrodat — dari Pemula hingga Mahir</p>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-wide flex flex-wrap items-center gap-3 py-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Cari materi..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="pemula">Pemula</SelectItem>
              <SelectItem value="menengah">Menengah</SelectItem>
              <SelectItem value="mahir">Mahir</SelectItem>
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lessons grid */}
      <section className="py-12">
        <div className="container-wide">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              {search || levelFilter !== 'all' || catFilter !== 'all'
                ? 'Tidak ada materi yang cocok dengan filter.'
                : 'Belum ada materi. Kembali lagi nanti! 📖'}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((lesson) => {
                const cat = categories.find((c) => c.id === lesson.category_id);
                return (
                  <Link
                    key={lesson.id}
                    href={`/belajar/${lesson.slug}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={`${levelColors[lesson.level]} text-xs flex-shrink-0`}>
                        {levelLabel[lesson.level]}
                      </Badge>
                      {cat && (
                        <span className="text-xs text-slate-400 truncate">{cat.name}</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h2 className="flex-1 text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {lesson.title}
                      </h2>
                    </div>
                    {lesson.description && (
                      <p className="mt-3 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-400">
                        Urutan #{lesson.order_index + 1}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
                        Pelajari <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
