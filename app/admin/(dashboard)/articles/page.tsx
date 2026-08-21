'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Loader2, FileText,
  RefreshCw, AlertCircle, Tag, X, Upload, Image as ImageIcon,
  FileDown, FileVideo,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Article, Category } from '@/lib/types';
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

/* ------------------------------------------------------------------ */
/* Schema                                                               */
/* ------------------------------------------------------------------ */
const articleSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(250),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, tanda hubung'),
  excerpt: z.string().max(400).optional(),
  content: z.string().optional(),
  category_id: z.string().optional(),
  read_time_minutes: z.coerce.number().int().min(1).max(120).default(5),
  cover_image_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  file_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  published: z.boolean().default(false),
});
type ArticleForm = z.infer<typeof articleSchema>;

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

/* ------------------------------------------------------------------ */
/* Tag Input Component                                                  */
/* ------------------------------------------------------------------ */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  function addTag() {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Tambah tag lalu tekan Enter..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            if (e.key === ',' ) { e.preventDefault(); addTag(); }
          }}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!input.trim()}>
          <Tag className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500" aria-label={`Hapus tag ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function AdminArticlesPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  /* filters */
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  /* dialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Article | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<ArticleForm>({ resolver: zodResolver(articleSchema) });

  const titleWatch = watch('title', '');
  const publishedWatch = watch('published', false);
  const coverImageUrlWatch = watch('cover_image_url', '');

  /* ---- handle image upload ---- */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Gagal', description: 'Ukuran file maksimal 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setValue('cover_image_url', publicUrl);
      toast({ title: 'Berhasil', description: 'Gambar berhasil diunggah' });
    } catch (error: any) {
      toast({ title: 'Gagal mengunggah', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  /* ---- handle document upload ---- */
  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Gagal', description: 'Hanya file PDF atau Word yang diperbolehkan', variant: 'destructive' });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Gagal', description: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setValue('file_url', publicUrl);
      toast({ title: 'Berhasil', description: 'Dokumen berhasil diunggah' });
    } catch (error: any) {
      toast({ title: 'Gagal mengunggah', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  /* ---- export pdf ---- */
  function exportToPDF(article: Article) {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFontSize(18);
    doc.text(article.title, margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    const date = format(new Date(article.created_at), 'd MMMM yyyy', { locale: localeId });
    doc.text(`Dibuat: ${date} | Estimasi baca: ${article.read_time_minutes} menit`, margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    const content = article.content || 'Konten tidak tersedia';
    const splitContent = doc.splitTextToSize(content, 170);
    doc.text(splitContent, margin, y);

    doc.save(`${article.slug}.pdf`);
  }

  /* ---- export word ---- */
  async function exportToWord(article: Article) {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: article.title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Dibuat: ${format(new Date(article.created_at), 'd MMMM yyyy', { locale: localeId })}`,
                italics: true,
              }),
              new TextRun({
                text: ` | Estimasi baca: ${article.read_time_minutes} menit`,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun(article.content || 'Konten tidak tersedia'),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${article.slug}.docx`);
  }

  /* ---- fetch ---- */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: articlesData }, { data: catsData }] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    if (articlesData) setArticles(articlesData as Article[]);
    if (catsData) setCategories(catsData as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* auto-slug */
  useEffect(() => {
    if (!editTarget && titleWatch) setValue('slug', slugify(titleWatch));
  }, [titleWatch, editTarget, setValue]);

  /* ---- filtered ---- */
  const filtered = articles.filter((a) => {
    if (statusTab === 'published' && !a.published) return false;
    if (statusTab === 'draft' && a.published) return false;
    if (catFilter !== 'all' && a.category_id !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.slug.includes(q)) return false;
    }
    return true;
  });

  /* ---- open dialogs ---- */
  function openNew() {
    setEditTarget(null);
    setServerError(null);
    setTags([]);
    reset({ title: '', slug: '', excerpt: '', content: '', category_id: '', read_time_minutes: 5, cover_image_url: '', published: false });
    setDialogOpen(true);
  }

  function openEdit(article: Article) {
    setEditTarget(article);
    setServerError(null);
    setTags(article.tags ?? []);
    reset({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt ?? '',
      content: article.content ?? '',
      category_id: article.category_id ?? '',
      read_time_minutes: article.read_time_minutes,
      cover_image_url: article.cover_image_url ?? '',
      published: article.published,
    });
    setDialogOpen(true);
  }

  /* ---- submit ---- */
  async function onSubmit(values: ArticleForm) {
    setServerError(null);
    const payload = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt || null,
      content: values.content || null,
      category_id: values.category_id || null,
      read_time_minutes: values.read_time_minutes,
      cover_image_url: values.cover_image_url || null,
      file_url: values.file_url || null,
      tags,
      published: values.published,
    };

    if (editTarget) {
      const { error } = await supabase.from('articles').update(payload as never).eq('id', editTarget.id);
      if (error) { setServerError(error.message.includes('unique') ? 'Slug sudah digunakan.' : error.message); return; }
      toast({ title: 'Artikel diperbarui' });
    } else {
      const { error } = await supabase.from('articles').insert(payload as never);
      if (error) { setServerError(error.message.includes('unique') ? 'Slug sudah digunakan.' : error.message); return; }
      toast({ title: 'Artikel ditambahkan' });
    }
    setDialogOpen(false);
    fetchAll();
  }

  /* ---- toggle publish ---- */
  async function togglePublish(article: Article) {
    setTogglingId(article.id);
    const { error } = await supabase.from('articles').update({ published: !article.published } as never).eq('id', article.id);
    if (error) toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    else {
      setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, published: !a.published } : a));
      toast({ title: article.published ? 'Artikel disembunyikan' : 'Artikel dipublikasikan' });
    }
    setTogglingId(null);
  }

  /* ---- delete ---- */
  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('articles').delete().eq('id', deleteTarget.id);
    if (error) toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Artikel dihapus' });
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  const counts = {
    all: articles.length,
    published: articles.filter((a) => a.published).length,
    draft: articles.filter((a) => !a.published).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Artikel</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola artikel dan konten blog.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
          </Button>
        </div>
      </div>

      {/* Tabs + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as typeof statusTab)}>
          <TabsList>
            <TabsTrigger value="all">Semua <span className="ml-1.5 text-xs opacity-60">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="published">Publik <span className="ml-1.5 text-xs opacity-60">{counts.published}</span></TabsTrigger>
            <TabsTrigger value="draft">Draft <span className="ml-1.5 text-xs opacity-60">{counts.draft}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
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
                <TableHead className="hidden lg:table-cell">Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Tag</TableHead>
                <TableHead className="hidden md:table-cell">Baca</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400">
                    {search ? 'Tidak ada artikel yang cocok.' : 'Belum ada artikel. Klik "Tulis Artikel" untuk memulai.'}
                  </TableCell>
                </TableRow>
              ) : filtered.map((article) => {
                const cat = categories.find((c) => c.id === article.category_id);
                return (
                  <TableRow key={article.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{article.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{article.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 lg:table-cell">
                      {cat?.name ?? <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(article.tags ?? []).slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tag}</span>
                        ))}
                        {(article.tags ?? []).length > 2 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">+{article.tags.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 md:table-cell">
                      {article.read_time_minutes} mnt
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={article.published}
                        onCheckedChange={() => togglePublish(article)}
                        disabled={togglingId === article.id}
                        aria-label={article.published ? 'Sembunyikan' : 'Publikasikan'}
                      />
                    </TableCell>
                    <TableCell className="hidden text-xs text-slate-400 md:table-cell">
                      {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale: localeId })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportToPDF(article)}>
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportToWord(article)}>
                              Export Word
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => openEdit(article)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeleteTarget(article)} aria-label="Hapus">
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
              <FileText className="h-5 w-5 text-violet-600" />
              {editTarget ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </DialogTitle>
            <DialogDescription>
              {editTarget ? 'Perbarui isi artikel.' : 'Isi form berikut untuk membuat artikel baru.'}
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
                <Label htmlFor="a-title">Judul Artikel <span className="text-red-500">*</span></Label>
                <Input id="a-title" placeholder="contoh: Pengantar Ilmu Nahwu" {...register('title')} className={errors.title ? 'border-red-400' : ''} />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-slug">Slug <span className="text-red-500">*</span></Label>
                <Input id="a-slug" placeholder="pengantar-ilmu-nahwu" {...register('slug')} className={errors.slug ? 'border-red-400' : ''} />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label htmlFor="a-excerpt">Ringkasan / Excerpt</Label>
              <Textarea id="a-excerpt" placeholder="Ringkasan singkat artikel yang tampil di halaman listing..." rows={2} {...register('excerpt')} />
              {errors.excerpt && <p className="text-xs text-red-500">{errors.excerpt.message}</p>}
            </div>

            {/* Category, Read time, Cover */}
            <div className="grid gap-4 sm:grid-cols-3">
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
                <Label htmlFor="a-read">Estimasi Baca (menit)</Label>
                <Input id="a-read" type="number" min={1} max={120} {...register('read_time_minutes')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-cover">Gambar Cover</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input id="a-cover" type="url" placeholder="https://..." {...register('cover_image_url')} className={errors.cover_image_url ? 'border-red-400 pl-8' : 'pl-8'} />
                    <ImageIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <input
                      type="file"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </Button>
                </div>
                {coverImageUrlWatch && (
                  <div className="mt-2 relative h-20 w-32 rounded-md overflow-hidden border">
                    <img src={coverImageUrlWatch} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                {errors.cover_image_url && <p className="text-xs text-red-500">{errors.cover_image_url.message}</p>}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>Tag</Label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

            {/* Content & File */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-content">Isi Artikel</Label>
                <Textarea
                  id="a-content"
                  placeholder="Tulis isi artikel di sini..."
                  rows={10}
                  {...register('content')}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-file">Unggah Dokumen (PDF/Word)</Label>
                <div className="flex gap-2">
                  <Input
                    id="a-file"
                    {...register('file_url')}
                    placeholder="URL dokumen..."
                    readOnly
                    className="bg-slate-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    <input
                      type="file"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      disabled={uploading}
                    />
                  </Button>
                </div>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Switch
                id="a-published"
                checked={publishedWatch}
                onCheckedChange={(v) => setValue('published', v)}
              />
              <div>
                <Label htmlFor="a-published" className="cursor-pointer font-medium">
                  {publishedWatch ? 'Dipublikasikan' : 'Draft (tidak ditampilkan)'}
                </Label>
                <p className="text-xs text-slate-400">
                  {publishedWatch ? 'Artikel ini terlihat oleh publik.' : 'Hanya bisa dilihat oleh admin/author.'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editTarget ? 'Simpan Perubahan' : 'Terbitkan Artikel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel <span className="font-semibold text-slate-900">"{deleteTarget?.title}"</span> akan dihapus permanen dan tidak dapat dikembalikan.
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
