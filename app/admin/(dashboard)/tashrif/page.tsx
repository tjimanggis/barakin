'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Loader2, BookMarked,
  RefreshCw, AlertCircle, Tag, X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Tashrif, Category } from '@/lib/types';
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

const tasrhifSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(250),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, tanda hubung'),
  description: z.string().max(500).optional(),
  category_id: z.string().optional(),
  level: z.enum(['pemula', 'menengah', 'mahir']).default('pemula'),
  base_verb: z.string().min(1, 'Kata kerja dasar wajib diisi'),
  conjugations: z.string().optional(),
  published: z.boolean().default(false),
});

type TasrhifFormData = z.infer<typeof tasrhifSchema>;

export default function TasrhifPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [tashrif, setTashrif] = useState<Tashrif[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tashrif | null>(null);
  const [editTarget, setEditTarget] = useState<Tashrif | null>(null);

  const { register, watch, reset, setValue, handleSubmit, formState: { errors } } = useForm<TasrhifFormData>({
    resolver: zodResolver(tasrhifSchema),
  });

  const publishedWatch = watch('published', false);

  // Load tashrif
  useEffect(() => {
    fetchTashrif();
    fetchCategories();
  }, []);

  async function fetchTashrif() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tashrif')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTashrif(data as Tashrif[]);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data as Category[]);
  }

  // Filter
  const filtered = tashrif.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusTab === 'published' && !a.published) return false;
    if (statusTab === 'draft' && a.published) return false;
    return true;
  });

  // Stats
  const counts = {
    all: tashrif.length,
    published: tashrif.filter((a) => a.published).length,
    draft: tashrif.filter((a) => !a.published).length,
  };

  async function onSubmit(values: TasrhifFormData) {
    try {
      const conjugations = values.conjugations ? JSON.parse(values.conjugations) : {};
      
      if (editTarget) {
        const { error } = await supabase
          .from('tashrif')
          .update({
            ...values,
            conjugations,
          } as never)
          .eq('id', editTarget.id);

        if (error) throw error;
        setTashrif((prev) =>
          prev.map((a) =>
            a.id === editTarget.id
              ? { ...a, ...values, conjugations }
              : a,
          ),
        );
        toast({ title: 'Tashrif diperbarui' });
      } else {
        const { error } = await supabase.from('tashrif').insert({
          ...values,
          conjugations,
        } as never);

        if (error) throw error;
        toast({ title: 'Tashrif ditambahkan' });
        fetchTashrif();
      }

      reset({ title: '', slug: '', description: '', category_id: '', level: 'pemula', base_verb: '', conjugations: '', published: false });
      setDialogOpen(false);
      setEditTarget(null);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Terjadi kesalahan' });
    }
  }

  async function togglePublish(item: Tashrif) {
    const { error } = await supabase
      .from('tashrif')
      .update({ published: !item.published } as never)
      .eq('id', item.id);

    if (!error) {
      setTashrif((prev) =>
        prev.map((a) =>
          a.id === item.id ? { ...a, published: !a.published } : a,
        ),
      );
      toast({
        title: item.published ? 'Tashrif disembunyikan' : 'Tashrif dipublikasikan',
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase.from('tashrif').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      setTashrif((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: 'Tashrif dihapus' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Gagal menghapus' });
    }
  }

  function openEdit(item: Tashrif) {
    setEditTarget(item);
    reset({
      title: item.title,
      slug: item.slug,
      description: item.description || '',
      category_id: item.category_id || '',
      level: item.level,
      base_verb: item.base_verb,
      conjugations: JSON.stringify(item.conjugations || {}),
      published: item.published,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tashrif</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola tabel tashrif (verb conjugation) bahasa Arab.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Cari tashrif..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTashrif}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            reset();
            setDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Tashrif
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as never)}>
        <TabsList>
          <TabsTrigger value="all">Semua <span className="ml-1.5 text-xs opacity-60">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="published">Publik <span className="ml-1.5 text-xs opacity-60">{counts.published}</span></TabsTrigger>
          <TabsTrigger value="draft">Draft <span className="ml-1.5 text-xs opacity-60">{counts.draft}</span></TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  {search ? 'Tidak ada tashrif yang cocok.' : 'Belum ada tashrif. Klik "Tambah Tashrif" untuk memulai.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {categories.find((c) => c.id === item.category_id)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.published}
                      onCheckedChange={() => togglePublish(item)}
                      aria-label={item.published ? 'Sembunyikan' : 'Publikasikan'}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeId })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Tashrif' : 'Tambah Tashrif Baru'}</DialogTitle>
            <DialogDescription>
              {editTarget ? 'Perbarui informasi tashrif.' : 'Isi form berikut untuk menambah tashrif baru.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="t-title">Judul Tashrif <span className="text-red-500">*</span></Label>
              <Input id="t-title" placeholder="Contoh: Tashrif Fiil Madhi" {...register('title')} />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="t-slug">Slug <span className="text-red-500">*</span></Label>
              <Input id="t-slug" placeholder="tashrif-fiil-madhi" {...register('slug')} />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-level">Level</Label>
                <Select defaultValue="pemula" onValueChange={(v) => setValue('level', v as never)}>
                  <SelectTrigger id="t-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pemula">Pemula</SelectItem>
                    <SelectItem value="menengah">Menengah</SelectItem>
                    <SelectItem value="mahir">Mahir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-category">Kategori</Label>
                <Select onValueChange={(v) => setValue('category_id', v)}>
                  <SelectTrigger id="t-category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="t-base">Kata Kerja Dasar <span className="text-red-500">*</span></Label>
              <Input id="t-base" placeholder="ف-ع-ل" {...register('base_verb')} />
              {errors.base_verb && <p className="mt-1 text-sm text-red-600">{errors.base_verb.message}</p>}
            </div>

            <div>
              <Label htmlFor="t-desc">Deskripsi</Label>
              <Textarea id="t-desc" placeholder="Penjelasan singkat tentang tashrif ini..." rows={2} {...register('description')} />
            </div>

            <div>
              <Label htmlFor="t-conj">Data Tashrif (JSON)</Label>
              <Textarea
                id="t-conj"
                placeholder={'{\n  "present": "يفعل",\n  "past": "فعل",\n  "imperative": "افعل"\n}'}
                rows={4}
                {...register('conjugations')}
              />
              <p className="mt-1 text-xs text-slate-500">Format JSON untuk menyimpan berbagai bentuk tashrif</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Switch
                id="t-published"
                checked={publishedWatch}
                onCheckedChange={(v) => setValue('published', v)}
              />
              <Label htmlFor="t-published" className="cursor-pointer font-medium">
                {publishedWatch ? 'Dipublikasikan' : 'Draft (tidak ditampilkan)'}
              </Label>
              <p className="ml-auto text-xs text-slate-500">
                {publishedWatch ? 'Tashrif ini terlihat oleh publik.' : 'Hanya bisa dilihat oleh admin/author.'}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editTarget ? 'Simpan Perubahan' : 'Tambah Tashrif'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tashrif?</AlertDialogTitle>
            <AlertDialogDescription>
              Tashrif <span className="font-semibold text-slate-900">"{deleteTarget?.title}"</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
