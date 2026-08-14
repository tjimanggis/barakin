'use client';

import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Harakat (tashkeel) Unicode chars                                     */
/* ------------------------------------------------------------------ */
// U+0610–U+061A, U+064B–U+065F, U+0670
const HARAKAT_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670]/g;

export function stripHarakat(text: string): string {
  return text.replace(HARAKAT_REGEX, '');
}

/* ------------------------------------------------------------------ */
/* Animated word — highlights stripped chars on hover                  */
/* ------------------------------------------------------------------ */
function ArabicWord({
  word,
  showHarakat,
}: {
  word: string;
  showHarakat: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  // Split word into characters, tag each as harakat or base
  const chars = Array.from(word).map((ch) => ({
    ch,
    isHarakat: HARAKAT_REGEX.test(ch),
  }));
  // reset regex state after use
  HARAKAT_REGEX.lastIndex = 0;

  return (
    <span
      className="inline-block cursor-default select-text"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {chars.map(({ ch, isHarakat }, i) => {
        if (!isHarakat) return <span key={i}>{ch}</span>;
        // harakat char — animate visibility
        return (
          <span
            key={i}
            className={cn(
              'transition-all duration-200',
              showHarakat || hovered
                ? 'opacity-100'
                : 'opacity-0 select-none',
            )}
            aria-hidden={!showHarakat && !hovered}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
interface HarakatToggleProps {
  /** Full Arabic text with harakat */
  voweled: string;
  /** Plain text without harakat (optional — will auto-strip if omitted) */
  plain?: string;
  className?: string;
}

export function HarakatToggle({ voweled, plain, className }: HarakatToggleProps) {
  const [showHarakat, setShowHarakat] = useState(true);

  // Split into lines then words for word-level rendering
  const lines = voweled.split('\n');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {showHarakat
            ? <Eye className="h-4 w-4 text-blue-500" />
            : <EyeOff className="h-4 w-4 text-slate-400" />}
          Mode Baca Harakat
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm', !showHarakat ? 'font-semibold text-slate-900' : 'text-slate-400')}>
            Tanpa Harakat
          </span>
          <Switch
            id="harakat-sw"
            checked={showHarakat}
            onCheckedChange={setShowHarakat}
          />
          <Label
            htmlFor="harakat-sw"
            className={cn('cursor-pointer text-sm', showHarakat ? 'font-semibold text-slate-900' : 'text-slate-400')}
          >
            Dengan Harakat
          </Label>
        </div>
      </div>

      {/* Hint */}
      {!showHarakat && (
        <p className="text-xs text-slate-400 italic">
          💡 Arahkan kursor ke kata untuk melihat harakat sementara.
        </p>
      )}

      {/* Text content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        {lines.map((line, li) => {
          if (!line.trim()) return <div key={li} className="h-3" />;
          const hasArabic = /[\u0600-\u06FF]/.test(line);

          if (!hasArabic) {
            return (
              <p key={li} className="my-3 text-base leading-relaxed text-slate-700">
                {line}
              </p>
            );
          }

          // Split Arabic line into words and spaces for RTL rendering
          const tokens = line.split(/(\s+)/);

          return (
            <p
              key={li}
              dir="rtl"
              className="my-5 text-right leading-loose text-slate-800"
              style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.7rem', lineHeight: '3' }}
            >
              {tokens.map((token, ti) =>
                /^\s+$/.test(token) ? (
                  <span key={ti}>{token}</span>
                ) : (
                  <ArabicWord key={ti} word={token} showHarakat={showHarakat} />
                ),
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
