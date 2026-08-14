'use client';

import { useState, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Search, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Built-in mufrodat dataset                                            */
/* ------------------------------------------------------------------ */
export interface MufrodatEntry {
  arabic: string;       // with harakat
  transliteration: string;
  meaning: string;
  category: string;
  root?: string;
}

const DEFAULT_MUFRODAT: MufrodatEntry[] = [
  // Kata benda dasar
  { arabic: 'كِتَابٌ',    transliteration: 'kitāb',    meaning: 'Buku',        category: 'Benda',  root: 'ك-ت-ب' },
  { arabic: 'قَلَمٌ',     transliteration: 'qalam',    meaning: 'Pena',        category: 'Benda',  root: 'ق-ل-م' },
  { arabic: 'بَيْتٌ',     transliteration: 'bayt',     meaning: 'Rumah',       category: 'Benda',  root: 'ب-ي-ت' },
  { arabic: 'مَدْرَسَةٌ', transliteration: 'madrasa',  meaning: 'Sekolah',     category: 'Benda',  root: 'د-ر-س' },
  { arabic: 'مَسْجِدٌ',   transliteration: 'masjid',   meaning: 'Masjid',      category: 'Benda',  root: 'س-ج-د' },
  { arabic: 'عِلْمٌ',     transliteration: 'ʿilm',     meaning: 'Ilmu',        category: 'Benda',  root: 'ع-ل-م' },
  { arabic: 'قَلْبٌ',     transliteration: 'qalb',     meaning: 'Hati / Jantung', category: 'Benda', root: 'ق-ل-ب' },
  { arabic: 'سَمَاءٌ',    transliteration: 'samāʾ',    meaning: 'Langit',      category: 'Alam',   root: 'س-م-و' },
  { arabic: 'أَرْضٌ',     transliteration: 'arḍ',      meaning: 'Bumi / Tanah',category: 'Alam',   root: 'أ-ر-ض' },
  { arabic: 'مَاءٌ',      transliteration: 'māʾ',      meaning: 'Air',         category: 'Alam',   root: 'م-و-ه' },
  { arabic: 'نُورٌ',      transliteration: 'nūr',      meaning: 'Cahaya',      category: 'Alam',   root: 'ن-و-ر' },
  // Kata kerja
  { arabic: 'قَرَأَ',     transliteration: 'qaraʾa',   meaning: 'Membaca',     category: 'Fiil',   root: 'ق-ر-أ' },
  { arabic: 'كَتَبَ',     transliteration: 'kataba',   meaning: 'Menulis',     category: 'Fiil',   root: 'ك-ت-ب' },
  { arabic: 'عَلِمَ',     transliteration: 'ʿalima',   meaning: 'Mengetahui',  category: 'Fiil',   root: 'ع-ل-م' },
  { arabic: 'ذَهَبَ',     transliteration: 'dhahaba',  meaning: 'Pergi',       category: 'Fiil',   root: 'ذ-ه-ب' },
  { arabic: 'جَلَسَ',     transliteration: 'jalasa',   meaning: 'Duduk',       category: 'Fiil',   root: 'ج-ل-س' },
  { arabic: 'فَتَحَ',     transliteration: 'fataḥa',   meaning: 'Membuka',     category: 'Fiil',   root: 'ف-ت-ح' },
  { arabic: 'دَخَلَ',     transliteration: 'dakhala',  meaning: 'Masuk',       category: 'Fiil',   root: 'د-خ-ل' },
  { arabic: 'خَرَجَ',     transliteration: 'kharaja',  meaning: 'Keluar',      category: 'Fiil',   root: 'خ-ر-ج' },
  // Kata sifat
  { arabic: 'كَبِيرٌ',    transliteration: 'kabīr',    meaning: 'Besar',       category: 'Sifat',  root: 'ك-ب-ر' },
  { arabic: 'صَغِيرٌ',    transliteration: 'ṣaghīr',   meaning: 'Kecil',       category: 'Sifat',  root: 'ص-غ-ر' },
  { arabic: 'جَمِيلٌ',    transliteration: 'jamīl',    meaning: 'Indah',       category: 'Sifat',  root: 'ج-م-ل' },
  { arabic: 'جَدِيدٌ',    transliteration: 'jadīd',    meaning: 'Baru',        category: 'Sifat',  root: 'ج-د-د' },
  { arabic: 'قَدِيمٌ',    transliteration: 'qadīm',    meaning: 'Lama / Kuno', category: 'Sifat',  root: 'ق-د-م' },
  // Bilangan
  { arabic: 'وَاحِدٌ',    transliteration: 'wāḥid',    meaning: 'Satu',        category: 'Bilangan' },
  { arabic: 'اثْنَانِ',   transliteration: 'ithnān',   meaning: 'Dua',         category: 'Bilangan' },
  { arabic: 'ثَلَاثَةٌ',  transliteration: 'thalātha', meaning: 'Tiga',        category: 'Bilangan' },
];

const CATEGORIES = ['Semua', 'Benda', 'Fiil', 'Sifat', 'Alam', 'Bilangan'];

/* ------------------------------------------------------------------ */
/* Single word audio button                                            */
/* ------------------------------------------------------------------ */
export function ArabicAudioButton({
  word,
  size = 'sm',
  className,
}: {
  word: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    // Strip harakat for cleaner TTS
    const clean = word.replace(/[\u064B-\u065F\u0610-\u061A\u0670]/g, '');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.pitch = 1;

    // Prefer an Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utterRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [word, playing, supported]);

  if (!supported) return null;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={speak}
      className={cn(
        'flex items-center justify-center rounded-full transition-colors',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        playing
          ? 'bg-blue-600 text-white'
          : 'border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300',
        className,
      )}
      aria-label={playing ? 'Stop' : `Dengarkan pelafalan ${word}`}
      title={playing ? 'Hentikan' : 'Dengarkan pelafalan'}
    >
      {playing ? (
        <VolumeX className={iconSize} />
      ) : (
        <Volume2 className={iconSize} />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Full Audio Makhraj Player (for kamus page)                          */
/* ------------------------------------------------------------------ */
interface AudioMakhrajPlayerProps {
  entries?: MufrodatEntry[];
  className?: string;
}

export function AudioMakhrajPlayer({
  entries = DEFAULT_MUFRODAT,
  className,
}: AudioMakhrajPlayerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const filtered = entries.filter((e) => {
    if (category !== 'Semua' && e.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.arabic.includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.transliteration.toLowerCase().includes(q) ||
        (e.root ?? '').includes(q)
      );
    }
    return true;
  });

  function speak(entry: MufrodatEntry) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (playingWord === entry.arabic) {
      window.speechSynthesis.cancel();
      setPlayingWord(null);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = entry.arabic.replace(/[\u064B-\u065F\u0610-\u061A\u0670]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.75;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => setPlayingWord(entry.arabic);
    utterance.onend = () => setPlayingWord(null);
    utterance.onerror = () => setPlayingWord(null);

    window.speechSynthesis.speak(utterance);
  }

  const catColors: Record<string, string> = {
    Benda:    'bg-blue-50 text-blue-700 border-blue-200',
    Fiil:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    Sifat:    'bg-violet-50 text-violet-700 border-violet-200',
    Alam:     'bg-amber-50 text-amber-700 border-amber-200',
    Bilangan: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className={cn('space-y-5', className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari kata, arti, atau akar..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                category === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} kata ditemukan &nbsp;·&nbsp;
        <span className="text-blue-500">
          🔊 Klik tombol speaker untuk mendengarkan pelafalan
        </span>
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          Tidak ada kata yang cocok.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry, i) => {
            const isPlaying = playingWord === entry.arabic;
            return (
              <div
                key={i}
                className={cn(
                  'group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all',
                  isPlaying
                    ? 'border-blue-300 shadow-blue-100 shadow-md ring-1 ring-blue-200'
                    : 'border-slate-200 hover:shadow-md',
                )}
              >
                {/* Category */}
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-xs', catColors[entry.category] ?? 'bg-slate-100 text-slate-600')}>
                    {entry.category}
                  </Badge>
                  {entry.root && (
                    <span
                      className="text-xs text-slate-400"
                      dir="rtl"
                      style={{ fontFamily: 'var(--font-arabic)' }}
                    >
                      {entry.root}
                    </span>
                  )}
                </div>

                {/* Arabic word */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p
                    dir="rtl"
                    className="text-3xl font-bold text-slate-900 leading-relaxed"
                    style={{ fontFamily: 'var(--font-arabic)' }}
                  >
                    {entry.arabic}
                  </p>
                  {/* Audio button */}
                  <button
                    type="button"
                    onClick={() => speak(entry)}
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all',
                      isPlaying
                        ? 'bg-blue-600 text-white scale-110'
                        : 'border border-slate-200 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300',
                    )}
                    aria-label={isPlaying ? 'Hentikan' : `Dengarkan ${entry.arabic}`}
                  >
                    {isPlaying
                      ? <VolumeX className="h-5 w-5" />
                      : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>

                {/* Transliteration + meaning */}
                <p className="mt-1 text-sm text-slate-400 italic">{entry.transliteration}</p>
                <p className="mt-1 text-base font-semibold text-slate-700">{entry.meaning}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
