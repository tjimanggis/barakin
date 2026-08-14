'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, FolderOpen, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const categorySchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(80),
  slug: z
    .string()
    .min(2, 'Slug minimal 2 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().max(300).optional(),
});
type CategoryForm = z.infer<typeof categorySchema>;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function AdminCategoriesPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema) });

  const nameValue = watch('name', '');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openNew() {
    setEditTarget(null);
    setServerError(null);
    reset({ name: '', slug: '', description: '' });
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditTarget(cat);
    setServerError(null);
    reset({ name: cat.name, slug: cat.slug, description: cat.description ?? '' });
    setDialogOpen(true);
  }

  // Auto-fill slug from name only when creating new
  useEffect(() => {
    if (!editTarget && nameValue) {
      setValue('slug', slugify(nameValue));
    }
  }, [nameValue, editTarget, setValue]);

  async function onSubmit(values: CategoryForm) {
    setServerError(null);
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
    };

    if (editTarget) {
      const { error } = await supabase
        .from('categories')
        .update(payload as never)
        .eq('id', editTarget.id);
      if (error) {
        setServerError(error.message.includes('unique') ? 'Nama atau slug sudah digunakan.' : error.message);
        return;
      }
      toast({ title: 'Kategori diperbarui' });
    } else {
      const { error } = await supabase.from('categories').insert(payload as never);
      if (error) {
        setServerError(error.message.includes('unique') ? 'Nama atau slug sudah digunakan.' : error.message);
        return;
      }
      toast({ title: 'Kategori ditambahkan' });
    }

    setDialogOpen(false);
    fetchCategories();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteTarget.id);
    if (error) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Kategori dihapus' });
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola kategori untuk materi dan artikel.
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
          <FolderOpen className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Belum ada kategori.</p>
          <Button onClick={openNew} size="sm" variant="outline" className="mt-4">
            Tambah Kategori Pertama
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{cat.name}</p>
                <p className="mt-0.5 text-xs font-mono text-slate-400">{cat.slug}</p>
                {cat.description && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
              <div className="ml-3 flex flex-shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(cat)}
                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteTarget(cat)}
                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              {editTarget ? 'Perbarui informasi kategori.' : 'Tambahkan kategori baru untuk mengorganisir konten.'}
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                placeholder="contoh: Nahwu"
                {...register('name')}
                className={errors.name ? 'border-red-400' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                placeholder="contoh: nahwu"
                {...register('slug')}
                className={errors.slug ? 'border-red-400' : ''}
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat kategori..."
                rows={3}
                {...register('description')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editTarget ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget?.name}
              </span>{' '}
              akan dihapus. Materi dan artikel di kategori ini tidak ikut terhapus
              (category_id akan menjadi null).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
