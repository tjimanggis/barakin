'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface TasrifRow {
  dhamir: string;      // ضمير — pronoun label
  dhahir: string;      // ظاهر  — visible pronoun in Arabic
  form: string;        // the conjugated form
  rootIndices: number[]; // which char indices carry root letters (for highlight)
}

interface WazanData {
  id: string;
  label: string;        // e.g. فَعَلَ - يَفْعُلُ
  meaning: string;      // e.g. "Bab I — Dhamma"
  root: string;         // display root e.g. ف-ع-ل
  madhi: TasrifRow[];   // ماضي  (past tense)
  mudhari: TasrifRow[]; // مضارع (present tense)
  amr: TasrifRow[];     // أمر   (imperative)
}

/* ------------------------------------------------------------------ */
/* Wazans data — three common babs of فعل                              */
/* ------------------------------------------------------------------ */
const WAZANS: WazanData[] = [
  {
    id: 'bab1',
    label: 'فَعَلَ - يَفْعُلُ',
    meaning: 'Bab I — Madhi Fatha, Mudhari Dhamma',
    root: 'ف-ع-ل',
    madhi: [
      { dhamir: 'هو',   dhahir: 'هُوَ',     form: 'فَعَلَ',    rootIndices: [0,2,4] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',    form: 'فَعَلَا',   rootIndices: [0,2,4] },
      { dhamir: 'هم',   dhahir: 'هُمْ',     form: 'فَعَلُوا',  rootIndices: [0,2,4] },
      { dhamir: 'هي',   dhahir: 'هِيَ',     form: 'فَعَلَتْ',  rootIndices: [0,2,4] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',    form: 'فَعَلَتَا', rootIndices: [0,2,4] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',    form: 'فَعَلْنَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ',   form: 'فَعَلْتَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'فَعَلْتُمَا',rootIndices: [0,2,4] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ', form: 'فَعَلْتُمْ',rootIndices: [0,2,4] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ',   form: 'فَعَلْتِ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'فَعَلْتُمَا',rootIndices: [0,2,4] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form: 'فَعَلْتُنَّ',rootIndices: [0,2,4] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',    form: 'فَعَلْتُ',  rootIndices: [0,2,4] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ',   form: 'فَعَلْنَا', rootIndices: [0,2,4] },
    ],
    mudhari: [
      { dhamir: 'هو',   dhahir: 'هُوَ',     form: 'يَفْعُلُ',  rootIndices: [2,4,6] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',    form: 'يَفْعُلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هم',   dhahir: 'هُمْ',     form: 'يَفْعُلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'هي',   dhahir: 'هِيَ',     form: 'تَفْعُلُ',  rootIndices: [2,4,6] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',    form: 'تَفْعُلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',    form: 'يَفْعُلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ',   form: 'تَفْعُلُ',  rootIndices: [2,4,6] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'تَفْعُلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ', form: 'تَفْعُلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ',   form: 'تَفْعُلِينَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'تَفْعُلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form: 'تَفْعُلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',    form: 'أَفْعُلُ',  rootIndices: [2,4,6] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ',   form: 'نَفْعُلُ',  rootIndices: [2,4,6] },
    ],
    amr: [
      { dhamir: 'أنت',   dhahir: 'أَنْتَ',    form: 'اُفْعُلْ',   rootIndices: [2,4,6] },
      { dhamir: 'أنتما', dhahir: 'أَنْتُمَا', form: 'اُفْعُلَا',  rootIndices: [2,4,6] },
      { dhamir: 'أنتم',  dhahir: 'أَنْتُمْ',  form: 'اُفْعُلُوا', rootIndices: [2,4,6] },
      { dhamir: 'أنتِ',  dhahir: 'أَنْتِ',    form: 'اُفْعُلِي',  rootIndices: [2,4,6] },
      { dhamir: 'أنتما', dhahir: 'أَنْتُمَا', form: 'اُفْعُلَا',  rootIndices: [2,4,6] },
      { dhamir: 'أنتن',  dhahir: 'أَنْتُنَّ', form: 'اُفْعُلْنَ', rootIndices: [2,4,6] },
    ],
  },
  {
    id: 'bab2',
    label: 'فَعَلَ - يَفْعِلُ',
    meaning: 'Bab II — Madhi Fatha, Mudhari Kasra',
    root: 'ف-ع-ل',
    madhi: [
      { dhamir: 'هو',   dhahir: 'هُوَ',   form: 'فَعَلَ',    rootIndices: [0,2,4] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',  form: 'فَعَلَا',   rootIndices: [0,2,4] },
      { dhamir: 'هم',   dhahir: 'هُمْ',   form: 'فَعَلُوا',  rootIndices: [0,2,4] },
      { dhamir: 'هي',   dhahir: 'هِيَ',   form: 'فَعَلَتْ',  rootIndices: [0,2,4] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',  form: 'فَعَلَتَا', rootIndices: [0,2,4] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',  form: 'فَعَلْنَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ', form: 'فَعَلْتَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ',form:'فَعَلْتُمْ',rootIndices: [0,2,4] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ', form: 'فَعَلْتِ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form:'فَعَلْتُنَّ',rootIndices:[0,2,4] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',  form: 'فَعَلْتُ',  rootIndices: [0,2,4] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ', form: 'فَعَلْنَا', rootIndices: [0,2,4] },
    ],
    mudhari: [
      { dhamir: 'هو',   dhahir: 'هُوَ',   form: 'يَفْعِلُ',   rootIndices: [2,4,6] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',  form: 'يَفْعِلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هم',   dhahir: 'هُمْ',   form: 'يَفْعِلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'هي',   dhahir: 'هِيَ',   form: 'تَفْعِلُ',   rootIndices: [2,4,6] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',  form: 'تَفْعِلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',  form: 'يَفْعِلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ', form: 'تَفْعِلُ',   rootIndices: [2,4,6] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ',form:'تَفْعِلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ', form: 'تَفْعِلِينَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form:'تَفْعِلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',  form: 'أَفْعِلُ',   rootIndices: [2,4,6] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ', form: 'نَفْعِلُ',   rootIndices: [2,4,6] },
    ],
    amr: [
      { dhamir: 'أنت',  dhahir: 'أَنْتَ',   form: 'اِفْعِلْ',   rootIndices: [2,4,6] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'اِفْعِلَا',  rootIndices: [2,4,6] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ', form: 'اِفْعِلُوا', rootIndices: [2,4,6] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ',   form: 'اِفْعِلِي',  rootIndices: [2,4,6] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form: 'اِفْعِلْنَ', rootIndices: [2,4,6] },
    ],
  },
  {
    id: 'bab3',
    label: 'فَعِلَ - يَفْعَلُ',
    meaning: 'Bab III — Madhi Kasra, Mudhari Fatha',
    root: 'ف-ع-ل',
    madhi: [
      { dhamir: 'هو',   dhahir: 'هُوَ',   form: 'فَعِلَ',    rootIndices: [0,2,4] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',  form: 'فَعِلَا',   rootIndices: [0,2,4] },
      { dhamir: 'هم',   dhahir: 'هُمْ',   form: 'فَعِلُوا',  rootIndices: [0,2,4] },
      { dhamir: 'هي',   dhahir: 'هِيَ',   form: 'فَعِلَتْ',  rootIndices: [0,2,4] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',  form: 'فَعِلَتَا', rootIndices: [0,2,4] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',  form: 'فَعِلْنَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ', form: 'فَعِلْتَ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ',form:'فَعِلْتُمْ',rootIndices: [0,2,4] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ', form: 'فَعِلْتِ',  rootIndices: [0,2,4] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form:'فَعِلْتُنَّ',rootIndices:[0,2,4] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',  form: 'فَعِلْتُ',  rootIndices: [0,2,4] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ', form: 'فَعِلْنَا', rootIndices: [0,2,4] },
    ],
    mudhari: [
      { dhamir: 'هو',   dhahir: 'هُوَ',   form: 'يَفْعَلُ',   rootIndices: [2,4,6] },
      { dhamir: 'هما♂', dhahir: 'هُمَا',  form: 'يَفْعَلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هم',   dhahir: 'هُمْ',   form: 'يَفْعَلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'هي',   dhahir: 'هِيَ',   form: 'تَفْعَلُ',   rootIndices: [2,4,6] },
      { dhamir: 'هما♀', dhahir: 'هُمَا',  form: 'تَفْعَلَانِ',rootIndices: [2,4,6] },
      { dhamir: 'هن',   dhahir: 'هُنَّ',  form: 'يَفْعَلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنت',  dhahir: 'أَنْتَ', form: 'تَفْعَلُ',   rootIndices: [2,4,6] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ',form:'تَفْعَلُونَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ', form: 'تَفْعَلِينَ',rootIndices: [2,4,6] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form:'تَفْعَلْنَ',rootIndices: [2,4,6] },
      { dhamir: 'أنا',  dhahir: 'أَنَا',  form: 'أَفْعَلُ',   rootIndices: [2,4,6] },
      { dhamir: 'نحن',  dhahir: 'نَحْنُ', form: 'نَفْعَلُ',   rootIndices: [2,4,6] },
    ],
    amr: [
      { dhamir: 'أنت',  dhahir: 'أَنْتَ',   form: 'اِفْعَلْ',   rootIndices: [2,4,6] },
      { dhamir: 'أنتما',dhahir: 'أَنْتُمَا',form: 'اِفْعَلَا',  rootIndices: [2,4,6] },
      { dhamir: 'أنتم', dhahir: 'أَنْتُمْ', form: 'اِفْعَلُوا', rootIndices: [2,4,6] },
      { dhamir: 'أنتِ', dhahir: 'أَنْتِ',   form: 'اِفْعَلِي',  rootIndices: [2,4,6] },
      { dhamir: 'أنتن', dhahir: 'أَنْتُنَّ',form: 'اِفْعَلْنَ', rootIndices: [2,4,6] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helper: highlight root letters in a form                            */
/* ------------------------------------------------------------------ */
function HighlightedForm({
  form,
  rootIndices,
}: {
  form: string;
  rootIndices: number[];
}) {
  // work on base chars (strip harakat for index matching)
  const stripped = form.replace(/[\u064B-\u065F\u0670]/g, '');
  let baseIdx = 0;
  const chars = Array.from(form);

  return (
    <span dir="rtl" style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.25rem' }}>
      {chars.map((ch, i) => {
        const isHarakat = /[\u064B-\u065F\u0670]/.test(ch);
        const currentBase = isHarakat ? baseIdx - 1 : baseIdx;
        const isRoot = rootIndices.includes(currentBase);
        if (!isHarakat) baseIdx++;
        return (
          <span
            key={i}
            className={cn(
              isRoot && !isHarakat
                ? 'text-blue-600 font-bold'
                : 'text-slate-800',
            )}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Main TasrifTable component                                           */
/* ------------------------------------------------------------------ */
export function TasrifTable({ className }: { className?: string }) {
  const [selectedWazan, setSelectedWazan] = useState<string>(WAZANS[0].id);
  const [tense, setTense] = useState<'madhi' | 'mudhari' | 'amr'>('madhi');

  const wazan = WAZANS.find((w) => w.id === selectedWazan) ?? WAZANS[0];
  const rows =
    tense === 'madhi' ? wazan.madhi : tense === 'mudhari' ? wazan.mudhari : wazan.amr;

  const tenseLabels = { madhi: 'ماضي', mudhari: 'مضارع', amr: 'أمر' };
  const tenseColors = {
    madhi:   'bg-blue-50 text-blue-700 border-blue-200',
    mudhari: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amr:     'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Tabel Tasrif{' '}
            <span style={{ fontFamily: 'var(--font-arabic)' }}>{wazan.label}</span>
          </h3>
          <p className="text-sm text-slate-500">{wazan.meaning}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Akar kata:</span>
          <span
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-base font-semibold text-blue-700"
            style={{ fontFamily: 'var(--font-arabic)' }}
            dir="rtl"
          >
            {wazan.root}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Wazan selector */}
        <Select value={selectedWazan} onValueChange={setSelectedWazan}>
          <SelectTrigger className="h-8 w-52 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WAZANS.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span style={{ fontFamily: 'var(--font-arabic)' }}>{w.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tense tabs */}
        <Tabs value={tense} onValueChange={(v) => setTense(v as typeof tense)}>
          <TabsList className="h-8">
            {(['madhi', 'mudhari', 'amr'] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs px-3 h-7">
                <span style={{ fontFamily: 'var(--font-arabic)' }}>{tenseLabels[t]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Current tense badge */}
        <span className={cn('rounded-full border px-3 py-0.5 text-xs font-semibold', tenseColors[tense])}>
          {tense === 'madhi' ? 'Lampau' : tense === 'mudhari' ? 'Sekarang / Akan Datang' : 'Perintah'}
        </span>
      </div>

      {/* Legend */}
      <p className="text-xs text-slate-400">
        <span className="font-bold text-blue-600">Huruf biru</span> = huruf asal (root letters)
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Dhamir</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                ضمير
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bentuk — <span style={{ fontFamily: 'var(--font-arabic)' }}>الصورة</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-slate-100 last:border-0 transition-colors hover:bg-blue-50/40',
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                )}
              >
                <td className="px-4 py-3 text-xs text-slate-300 font-mono">{i + 1}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.dhamir}</td>
                <td
                  className="px-4 py-3 text-right text-base text-slate-700"
                  dir="rtl"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                >
                  {row.dhahir}
                </td>
                <td className="px-4 py-3 text-right">
                  <HighlightedForm form={row.form} rootIndices={row.rootIndices} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
