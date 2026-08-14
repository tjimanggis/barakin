'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, Loader2,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Kosakata, Category, WordType } from '@/lib/types';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const kosakataSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(250),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, tanda hubung'),
  description: z.string().max(500).optional(),
  category_id: z.string().optional(),
  level: z.enum(['pemula', 'menengah', 'mahir']).default('pemula'),
  arabic_text: z.string().min(1, 'Teks Arab wajib diisi'),
  arabic_harakat: z.string().optional(),
  indonesia_meaning: z.string().min(1, 'Arti Indonesia wajib diisi'),
  example_sentence_ar: z.string().optional(),
  example_sentence_id: z.string().optional(),
  word_type: z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'other']).optional(),
  published: z.boolean().default(false),
});

type KosakataFormData = z.infer<typeof kosakataSchema>;

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: 'noun', label: 'Kata Benda' },
  { value: 'verb', label: 'Kata Kerja' },
  { value: 'adjective', label: 'Kata Sifat' },
  { value: 'adverb', label: 'Kata Keterangan' },
  { value: 'preposition', label: 'Kata Depan' },
  { value: 'other', label: 'Lainnya' },
];

export default function KosakataPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [kosakata, setKosakata] = useState<Kosakata[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Kosakata | null>(null);
  const [editTarget, setEditTarget] = useState<Kosakata | null>(null);

  const { register, watch, reset, setValue, handleSubmit, formState: { errors } } = useForm<KosakataFormData>({
    resolver: zodResolver(kosakataSchema),
  });

  const publishedWatch = watch('published', false);

  // Load data
  useEffect(() => {
    fetchKosakata();
    fetchCategories();
  }, []);

  async function fetchKosakata() {
    setLoading(true);
    const { data, error } = await supabase
      .from('kosakata')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKosakata(data as Kosakata[]);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data as Category[]);
  }

  // Filter
  const filtered = kosakata.filter((k) => {
    if (search && !k.arabic_text.includes(search) && !k.indonesia_meaning.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusTab === 'published' && !k.published) return false;
    if (statusTab === 'draft' && k.published) return false;
    return true;
  });

  // Stats
  const counts = {
    all: kosakata.length,
    published: kosakata.filter((k) => k.published).length,
    draft: kosakata.filter((k) => !k.published).length,
  };

  async function onSubmit(values: KosakataFormData) {
    try {
      if (editTarget) {
        const { error } = await supabase
          .from('kosakata')
          .update(values as never)
          .eq('id', editTarget.id);

        if (error) throw error;
        setKosakata((prev) =>
          prev.map((k) =>
            k.id === editTarget.id ? { ...k, ...values } : k,
          ),
        );
        toast({ title: 'Kosakata diperbarui' });
      } else {
        const { error } = await supabase.from('kosakata').insert(values as never);
        if (error) throw error;
        toast({ title: 'Kosakata ditambahkan' });
        fetchKosakata();
      }

      reset();
      setDialogOpen(false);
      setEditTarget(null);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Terjadi kesalahan' });
    }
  }

  async function togglePublish(item: Kosakata) {
    const { error } = await supabase
      .from('kosakata')
      .update({ published: !item.published } as never)
      .eq('id', item.id);

    if (!error) {
      setKosakata((prev) =>
        prev.map((k) =>
          k.id === item.id ? { ...k, published: !k.published } : k,
        ),
      );
      toast({
        title: item.published ? 'Kosakata disembunyikan' : 'Kosakata dipublikasikan',
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase.from('kosakata').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      setKosakata((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: 'Kosakata dihapus' });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Gagal menghapus' });
    }
  }

  function openEdit(item: Kosakata) {
    setEditTarget(item);
    reset(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kosakata</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola kosakata (vocabulary) bahasa Arab.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Cari kosakata (Arab atau Indonesia)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchKosakata}
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
          <Plus className="mr-2 h-4 w-4" /> Tambah Kosakata
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
              <TableHead>Arab</TableHead>
              <TableHead>Arti</TableHead>
              <TableHead>Jenis Kata</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  {search ? 'Tidak ada kosakata yang cocok.' : 'Belum ada kosakata. Klik "Tambah Kosakata" untuk memulai.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-arabic text-lg">{item.arabic_text}</TableCell>
                  <TableCell>{item.indonesia_meaning}</TableCell>
                  <TableCell className="text-sm">
                    {item.word_type
                      ? WORD_TYPES.find((w) => w.value === item.word_type)?.label
                      : '-'}
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
            <DialogTitle>{editTarget ? 'Edit Kosakata' : 'Tambah Kosakata Baru'}</DialogTitle>
            <DialogDescription>
              {editTarget ? 'Perbarui informasi kosakata.' : 'Isi form berikut untuk menambah kosakata baru.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="k-arabic">Teks Arab <span className="text-red-500">*</span></Label>
                <Input id="k-arabic" placeholder="كتاب" {...register('arabic_text')} className="font-arabic text-lg" />
                {errors.arabic_text && <p className="mt-1 text-sm text-red-600">{errors.arabic_text.message}</p>}
              </div>
              <div>
                <Label htmlFor="k-harakat">Dengan Harakat</Label>
                <Input id="k-harakat" placeholder="كِتَاب" {...register('arabic_harakat')} className="font-arabic text-lg" />
              </div>
            </div>

            <div>
              <Label htmlFor="k-meaning">Arti Indonesia <span className="text-red-500">*</span></Label>
              <Input id="k-meaning" placeholder="Buku" {...register('indonesia_meaning')} />
              {errors.indonesia_meaning && <p className="mt-1 text-sm text-red-600">{errors.indonesia_meaning.message}</p>}
            </div>

            <div>
              <Label htmlFor="k-title">Judul/Label (opsional)</Label>
              <Input id="k-title" placeholder="Peralatan Sekolah" {...register('title')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="k-level">Level</Label>
                <Select defaultValue="pemula" onValueChange={(v) => setValue('level', v as never)}>
                  <SelectTrigger id="k-level">
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
                <Label htmlFor="k-type">Jenis Kata</Label>
                <Select onValueChange={(v) => setValue('word_type', v as never)}>
                  <SelectTrigger id="k-type">
                    <SelectValue placeholder="Pilih jenis kata" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORD_TYPES.map((wt) => (
                      <SelectItem key={wt.value} value={wt.value}>
                        {wt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="k-category">Kategori</Label>
              <Select onValueChange={(v) => setValue('category_id', v)}>
                <SelectTrigger id="k-category">
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

            <div>
              <Label htmlFor="k-example-ar">Contoh Kalimat (Arab)</Label>
              <Textarea id="k-example-ar" placeholder="كتابي جميل" rows={2} {...register('example_sentence_ar')} />
            </div>

            <div>
              <Label htmlFor="k-example-id">Contoh Kalimat (Indonesia)</Label>
              <Textarea id="k-example-id" placeholder="Bukuku itu indah" rows={2} {...register('example_sentence_id')} />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Switch
                id="k-published"
                checked={publishedWatch}
                onCheckedChange={(v) => setValue('published', v)}
              />
              <Label htmlFor="k-published" className="cursor-pointer font-medium">
                {publishedWatch ? 'Dipublikasikan' : 'Draft (tidak ditampilkan)'}
              </Label>
              <p className="ml-auto text-xs text-slate-500">
                {publishedWatch ? 'Kosakata ini terlihat oleh publik.' : 'Hanya bisa dilihat oleh admin/author.'}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editTarget ? 'Simpan Perubahan' : 'Tambah Kosakata'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kosakata?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-arabic text-lg font-semibold text-slate-900">{deleteTarget?.arabic_text}</span>
              {' '}({deleteTarget?.indonesia_meaning}) akan dihapus permanen.
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
