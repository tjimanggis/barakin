'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Loader2, BookOpen,
  RefreshCw, Eye, EyeOff, AlertCircle, ChevronDown,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Lesson, Category, LessonLevel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */
const lessonSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, tanda hubung'),
  description: z.string().max(500).optional(),
  level: z.enum(['pemula', 'menengah', 'mahir']),
  category_id: z.string().optional(),
  order_index: z.coerce.number().int().min(0).default(0),
  content_voweled: z.string().optional(),
  content_plain: z.string().optional(),
  published: z.boolean().default(false),
});
type LessonForm = z.infer<typeof lessonSchema>;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function slugify(t: string) {
  return t.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const levelColors: Record<LessonLevel, string> = {
  pemula:   'bg-blue-50 text-blue-700 border-blue-200',
  menengah: 'bg-amber-50 text-amber-700 border-amber-200',
  mahir:    'bg-rose-50 text-rose-700 border-rose-200',
};

const levelLabel: Record<LessonLevel, string> = {
  pemula: 'Pemula', menengah: 'Menengah', mahir: 'Mahir',
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function AdminLessonsPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* filters */
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<LessonForm>({ resolver: zodResolver(lessonSchema) });

  const titleWatch = watch('title', '');
  const publishedWatch = watch('published', false);

  /* ---- fetch ---- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: lessonsData }, { data: catsData }] = await Promise.all([
      supabase.from('lessons').select('*').order('order_index').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (lessonsData) setLessons(lessonsData as Lesson[]);
    if (catsData) setCategories(catsData as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* auto-slug from title (new only) */
  useEffect(() => {
    if (!editTarget && titleWatch) setValue('slug', slugify(titleWatch));
  }, [titleWatch, editTarget, setValue]);

  /* ---- filtered list ---- */
  const filtered = lessons.filter((l) => {
    if (statusTab === 'published' && !l.published) return false;
    if (statusTab === 'draft' && l.published) return false;
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (catFilter !== 'all' && l.category_id !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.slug.includes(q)) return false;
    }
    return true;
  });

  /* ---- open dialogs ---- */
  function openNew() {
    setEditTarget(null);
    setServerError(null);
    reset({ title: '', slug: '', description: '', level: 'pemula', category_id: '', order_index: 0, content_voweled: '', content_plain: '', published: false });
    setDialogOpen(true);
  }

  function openEdit(lesson: Lesson) {
    setEditTarget(lesson);
    setServerError(null);
    reset({
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description ?? '',
      level: lesson.level,
      category_id: lesson.category_id ?? '',
      order_index: lesson.order_index,
      content_voweled: lesson.content_voweled ?? '',
      content_plain: lesson.content_plain ?? '',
      published: lesson.published,
    });
    setDialogOpen(true);
  }

  /* ---- submit ---- */
  async function onSubmit(values: LessonForm) {
    setServerError(null);
    const payload = {
      title: values.title,
      slug: values.slug,
      description: values.description || null,
      level: values.level,
      category_id: values.category_id || null,
      order_index: values.order_index,
      content_voweled: values.content_voweled || null,
      content_plain: values.content_plain || null,
      published: values.published,
    };

    if (editTarget) {
      const { error } = await supabase.from('lessons').update(payload as never).eq('id', editTarget.id);
      if (error) { setServerError(error.message.includes('unique') ? 'Slug sudah digunakan.' : error.message); return; }
      toast({ title: 'Materi diperbarui' });
    } else {
      const { error } = await supabase.from('lessons').insert(payload as never);
      if (error) { setServerError(error.message.includes('unique') ? 'Slug sudah digunakan.' : error.message); return; }
      toast({ title: 'Materi ditambahkan' });
    }
    setDialogOpen(false);
    fetchAll();
  }

  /* ---- toggle publish ---- */
  async function togglePublish(lesson: Lesson) {
    setTogglingId(lesson.id);
    const { error } = await supabase.from('lessons').update({ published: !lesson.published } as never).eq('id', lesson.id);
    if (error) toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    else {
      setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, published: !l.published } : l));
      toast({ title: lesson.published ? 'Materi disembunyikan' : 'Materi dipublikasikan' });
    }
    setTogglingId(null);
  }

  /* ---- delete ---- */
  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('lessons').delete().eq('id', deleteTarget.id);
    if (error) toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Materi dihapus' });
      setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  /* ---- counts ---- */
  const counts = {
    all: lessons.length,
    published: lessons.filter((l) => l.published).length,
    draft: lessons.filter((l) => !l.published).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materi</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola materi pelajaran bahasa Arab.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Materi
          </Button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as typeof statusTab)}>
          <TabsList>
            <TabsTrigger value="all">Semua <span className="ml-1.5 text-xs opacity-60">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="published">Publik <span className="ml-1.5 text-xs opacity-60">{counts.published}</span></TabsTrigger>
            <TabsTrigger value="draft">Draft <span className="ml-1.5 text-xs opacity-60">{counts.draft}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="pemula">Pemula</SelectItem>
              <SelectItem value="menengah">Menengah</SelectItem>
              <SelectItem value="mahir">Mahir</SelectItem>
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Cari judul atau slug..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Judul</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="hidden lg:table-cell">Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Urutan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                    {search ? 'Tidak ada materi yang cocok.' : 'Belum ada materi. Klik "Tambah Materi" untuk memulai.'}
                  </TableCell>
                </TableRow>
              ) : filtered.map((lesson) => {
                const cat = categories.find((c) => c.id === lesson.category_id);
                return (
                  <TableRow key={lesson.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{lesson.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{lesson.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${levelColors[lesson.level]} text-xs`}>{levelLabel[lesson.level]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 lg:table-cell">
                      {cat?.name ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 md:table-cell">{lesson.order_index}</TableCell>
                    <TableCell>
                      <Switch
                        checked={lesson.published}
                        onCheckedChange={() => togglePublish(lesson)}
                        disabled={togglingId === lesson.id}
                        aria-label={lesson.published ? 'Sembunyikan' : 'Publikasikan'}
                      />
                    </TableCell>
                    <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                      {formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true, locale: localeId })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEdit(lesson)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeleteTarget(lesson)} aria-label="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ===== ADD / EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              {editTarget ? 'Edit Materi' : 'Tambah Materi Baru'}
            </DialogTitle>
            <DialogDescription>
              {editTarget ? 'Perbarui informasi materi.' : 'Isi form berikut untuk menambah materi baru.'}
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title & Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="l-title">Judul Materi <span className="text-red-500">*</span></Label>
                <Input id="l-title" placeholder="contoh: Pengantar Nahwu" {...register('title')} className={errors.title ? 'border-red-400' : ''} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-slug">Slug <span className="text-red-500">*</span></Label>
                <Input id="l-slug" placeholder="pengantar-nahwu" {...register('slug')} className={errors.slug ? 'border-red-400' : ''} />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="l-desc">Deskripsi Singkat</Label>
              <Textarea id="l-desc" placeholder="Deskripsi singkat tentang materi ini..." rows={2} {...register('description')} />
            </div>

            {/* Level, Category, Order */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Level <span className="text-red-500">*</span></Label>
                <Select defaultValue={editTarget?.level ?? 'pemula'} onValueChange={(v) => setValue('level', v as LessonLevel)}>
                  <SelectTrigger className={errors.level ? 'border-red-400' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pemula">Pemula</SelectItem>
                    <SelectItem value="menengah">Menengah</SelectItem>
                    <SelectItem value="mahir">Mahir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select defaultValue={editTarget?.category_id ?? ''} onValueChange={(v) => setValue('category_id', v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tanpa Kategori —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-order">Urutan</Label>
                <Input id="l-order" type="number" min={0} {...register('order_index')} />
              </div>
            </div>

            {/* Content Voweled */}
            <div className="space-y-1.5">
              <Label htmlFor="l-voweled">
                Konten Bertanda Baca{' '}
                <span className="text-xs text-slate-400">(dengan harakat)</span>
              </Label>
              <Textarea
                id="l-voweled"
                placeholder="Tulis konten materi dengan tanda baca (harakat)..."
                rows={6}
                {...register('content_voweled')}
                className="font-mono text-sm"
                dir="auto"
              />
            </div>

            {/* Content Plain */}
            <div className="space-y-1.5">
              <Label htmlFor="l-plain">
                Konten Tanpa Tanda Baca{' '}
                <span className="text-xs text-slate-400">(kitab gundul)</span>
              </Label>
              <Textarea
                id="l-plain"
                placeholder="Tulis konten materi tanpa tanda baca (kitab gundul)..."
                rows={6}
                {...register('content_plain')}
                className="font-mono text-sm"
                dir="auto"
              />
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Switch
                id="l-published"
                checked={publishedWatch}
                onCheckedChange={(v) => setValue('published', v)}
              />
              <div>
                <Label htmlFor="l-published" className="cursor-pointer font-medium">
                  {publishedWatch ? 'Dipublikasikan' : 'Draft (tidak ditampilkan)'}
                </Label>
                <p className="text-xs text-slate-400">
                  {publishedWatch ? 'Materi ini terlihat oleh publik.' : 'Hanya bisa dilihat oleh admin/author.'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editTarget ? 'Simpan Perubahan' : 'Tambah Materi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
            <AlertDialogDescription>
              Materi <span className="font-semibold text-slate-900">"{deleteTarget?.title}"</span> akan dihapus permanen beserta semua kuis dan progres pengguna terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
