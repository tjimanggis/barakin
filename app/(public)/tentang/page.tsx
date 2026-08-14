import Link from 'next/link';
import {
  BookOpen,
  Target,
  Heart,
  Users,
  Lightbulb,
  GraduationCap,
  Globe,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Static data                                                          */
/* ------------------------------------------------------------------ */
const values = [
  {
    icon: BookOpen,
    title: 'Ilmu yang Bermanfaat',
    description:
      'Kami percaya bahwa ilmu bahasa Arab adalah kunci untuk memahami Al-Qur\'an dan khazanah Islam secara langsung dari sumbernya.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Heart,
    title: 'Belajar dengan Cinta',
    description:
      'Proses belajar yang menyenangkan, tidak membebani, dan dilakukan dengan hati yang tulus menghasilkan pemahaman yang lebih dalam.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Lightbulb,
    title: 'Metode Modern',
    description:
      'Memadukan metode pengajaran klasik (kitab kuning) dengan pendekatan digital modern agar materi mudah dipahami semua kalangan.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Globe,
    title: 'Terbuka untuk Semua',
    description:
      'Barakin gratis dan terbuka untuk siapa saja — pelajar, mahasiswa, santri, hingga profesional yang ingin mendalami bahasa Arab.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const team = [
  {
    name: 'Tim Kurikulum',
    role: 'Penyusun Materi',
    description:
      'Anak Pesantren yang insya allah berpengalaman dalam menyusun materi Nahwu, Sharaf, dan Mufrodat yang sesuai dengan kebutuhan pelajar Indonesia.',
    initials: 'TK',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Tim Teknologi',
    role: 'Pengembang Platform',
    description:
      'Developer yang berkomitmen membangun pengalaman belajar digital yang nyaman, cepat, dan mudah diakses.',
    initials: 'TT',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    name: 'Tim Konten',
    role: 'Penulis & Editor',
    description:
      'Penulis berpengalaman yang menghadirkan artikel dan referensi bahasa Arab yang akurat dan mudah dipahami.',
    initials: 'TK',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

const milestones = [
  { year: '2026', event: 'Barakin mulai dikembangkan sebagai proyek pembelajaran pribadi.' },
  { year: '2026', event: 'Platform diluncurkan ke publik dengan modul Nahwu dasar.' },
  { year: '2026', event: 'Penambahan kamus akar kata, dan artikel.' },
];

const stats = [
  { value: '5+', label: 'Materi Tersedia' },
  { value: '100+(aamiin)', label: 'Pelajar Aktif' },
  { value: '5+', label: 'Artikel Ditulis' },
   { value: '45%', label: 'Tingkat Penyelesaian' }
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function TentangPage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 py-24 text-white">
        {/* Arabic decorative text */}
        <div
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none text-[120px] leading-none text-white/5"
          style={{ fontFamily: 'var(--font-arabic)' }}
          aria-hidden="true"
        >
          بَرَاكِن
        </div>

        <div className="container-wide relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100">
            <Heart className="h-3.5 w-3.5" />
            Platform Pembelajaran Bahasa Arab
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight md:text-5xl">
            Tentang Barakin
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-blue-100">
            Barakin adalah platform pembelajaran bahasa Arab modern yang dirancang khusus
            untuk penutur bahasa Indonesia. Kami hadir untuk membuat ilmu Nahwu, Sharaf,
            dan Mufrodat lebih mudah, menyenangkan, dan dapat diakses siapa saja.
          </p>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="container-wide">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-blue-600">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Misi & Visi ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="container-wide">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Misi */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Misi Kami</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Menyediakan platform pembelajaran bahasa Arab yang komprehensif, terstruktur,
                dan dapat diakses secara gratis oleh seluruh masyarakat Indonesia — dari
                pelajar pemula hingga yang ingin memperdalam tata bahasa Arab klasik.
              </p>
              <ul className="mt-5 space-y-2">
                {[
                  'Materi berbasis kurikulum pesantren & universitas Islam',
                  'Konten tersedia dalam dua mode: bertanda baca & tanpa tanda baca',
                  'Kuis interaktif untuk mengukur pemahaman',
                  'Kamus akar kata berbasis morfologi Arab',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visi */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Visi Kami</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Menjadi platform referensi utama pembelajaran bahasa Arab di Indonesia —
                tempat di mana siapa saja bisa memulai perjalanan memahami Al-Qur'an dan
                literatur Islam klasik secara mandiri, kapan saja, dan di mana saja.
              </p>
              <div
                className="mt-6 rounded-xl bg-emerald-50 p-5 text-center"
                dir="rtl"
              >
                <p
                  className="arabic-text text-emerald-800"
                  style={{ fontFamily: 'var(--font-arabic)' }}
                >
                  مَنْ أَرَادَ الدُّنْيَا فَعَلَيْهِ بِالْعِلْمِ
                </p>
                <p className="mt-2 text-xs text-emerald-600">
                  &ldquo;Siapa yang menginginkan dunia, wajib atasnya ilmu.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Nilai-nilai ──────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="container-wide">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Nilai-nilai Kami</h2>
            <p className="mt-3 text-slate-500">
              Prinsip yang mendasari setiap keputusan dan konten di Barakin.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-shadow hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${v.color}`}
                >
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Perjalanan ───────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="container-wide">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Perjalanan Barakin</h2>
            <p className="mt-3 text-slate-500">Dari ide sederhana hingga platform yang terus berkembang.</p>
          </div>
          <div className="mx-auto max-w-2xl">
            <ol className="relative border-l-2 border-blue-200 pl-8 space-y-8">
              {milestones.map((m, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[2.35rem] flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                    {m.year}
                  </p>
                  <p className="mt-1 text-slate-700">{m.event}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Tim ─────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="container-wide">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Tim Barakin</h2>
            <p className="mt-3 text-slate-500">
              Kolaborasi antara ulama, pendidik, dan teknologi untuk menghadirkan
              pengalaman belajar terbaik.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${member.color}`}
                >
                  {member.initials}
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm font-medium text-blue-600">{member.role}</p>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bergabung CTA ────────────────────────────────────── */}
      <section className="bg-blue-600 py-20 text-white">
        <div className="container-wide text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Bergabung dengan Ribuan Pelajar</h2>
          <p className="mt-3 mx-auto max-w-xl text-blue-100">
            Mulai perjalanan belajar bahasa Arab Anda hari ini. Gratis, terstruktur,
            dan didukung komunitas yang terus berkembang.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              <Link href="/register">
                Mulai Belajar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/belajar">Lihat Materi</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
