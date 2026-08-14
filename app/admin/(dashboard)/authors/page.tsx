'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  UserPlus,
  Search,
  RefreshCw,
  KeyRound,
  Shield,
  Loader2,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  PenLine,
} from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/* ------------------------------------------------------------------ */
/* Schemas                                                              */
/* ------------------------------------------------------------------ */
const createSchema = z
  .object({
    displayName: z.string().min(2, 'Nama minimal 2 karakter').max(60),
    email: z.string().email('Email tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus ada huruf kapital')
      .regex(/[0-9]/, 'Harus ada angka'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus ada huruf kapital')
      .regex(/[0-9]/, 'Harus ada angka'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

const editNameSchema = z.object({
  displayName: z.string().min(2, 'Nama minimal 2 karakter').max(60),
});

type CreateForm = z.infer<typeof createSchema>;
type ResetForm = z.infer<typeof resetSchema>;
type EditNameForm = z.infer<typeof editNameSchema>;

/* ------------------------------------------------------------------ */
/* Helper — password input with show/hide toggle                        */
/* ------------------------------------------------------------------ */
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ hasError, className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          className={`pr-10 ${hasError ? 'border-red-400' : ''} ${className ?? ''}`}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function AdminAuthorsPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [authors, setAuthors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* dialogs */
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [editNameTarget, setEditNameTarget] = useState<Profile | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<Profile | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);

  /* forms */
  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const editNameForm = useForm<EditNameForm>({ resolver: zodResolver(editNameSchema) });

  /* ---- fetch ---- */
  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['author', 'admin'])
      .order('created_at', { ascending: false });
    if (data) setAuthors(data as Profile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAuthors(); }, [fetchAuthors]);

  const filtered = authors.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.display_name?.toLowerCase().includes(q) || a.id.includes(q);
  });

  /* ---- create author ---- */
  async function handleCreate(values: CreateForm) {
    setServerError(null);
    const res = await fetch('/api/admin/create-author', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      }),
    });
    const json = await res.json();

    if (!res.ok && res.status !== 207) {
      setServerError(json.error ?? 'Gagal membuat akun author.');
      return;
    }

    if (res.status === 207) {
      toast({ title: 'Akun dibuat (role perlu diset manual)', description: json.warning, variant: 'destructive' });
    } else {
      toast({ title: `Author ${values.displayName} berhasil dibuat` });
    }

    setCreateOpen(false);
    createForm.reset();
    fetchAuthors();
  }

  /* ---- reset password ---- */
  async function handleReset(values: ResetForm) {
    if (!resetTarget) return;
    setServerError(null);
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetTarget.id, newPassword: values.newPassword }),
    });
    const json = await res.json();

    if (!res.ok) {
      setServerError(json.error ?? 'Gagal reset password.');
      return;
    }

    toast({ title: `Password ${resetTarget.display_name} berhasil direset` });
    setResetTarget(null);
    resetForm.reset();
  }

  /* ---- edit display name ---- */
  async function handleEditName(values: EditNameForm) {
    if (!editNameTarget) return;
    setServerError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('admin_reset_display_name', {
      p_user_id: editNameTarget.id,
      p_name: values.displayName,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    toast({ title: 'Nama berhasil diubah' });
    setAuthors((prev) =>
      prev.map((a) =>
        a.id === editNameTarget.id ? { ...a, display_name: values.displayName } : a,
      ),
    );
    setEditNameTarget(null);
    editNameForm.reset();
  }

  /* ---- demote to user ---- */
  async function handleDemote() {
    if (!demoteTarget) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('set_user_role', {
      p_target_user: demoteTarget.id,
      p_role: 'user',
    });

    if (error) {
      toast({ title: 'Gagal menonaktifkan', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${demoteTarget.display_name} dinonaktifkan sebagai author` });
      setAuthors((prev) => prev.filter((a) => a.id !== demoteTarget.id));
    }
    setDemoteTarget(null);
  }

  /* ---- open dialogs helpers ---- */
  function openCreate() {
    setServerError(null);
    createForm.reset();
    setCreateOpen(true);
  }

  function openReset(profile: Profile) {
    setServerError(null);
    resetForm.reset();
    setResetTarget(profile);
  }

  function openEditName(profile: Profile) {
    setServerError(null);
    editNameForm.reset({ displayName: profile.display_name ?? '' });
    setEditNameTarget(profile);
  }

  /* ---- render ---- */
  const roleColors: Record<string, string> = {
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
    author: 'bg-violet-50 text-violet-700 border-violet-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Author</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tambah, edit nama, reset password, atau nonaktifkan author.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAuthors} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Author
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {authors.filter((a) => a.role === 'author').length}
          </p>
          <p className="text-xs text-slate-500">Author aktif</p>
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {authors.filter((a) => a.role === 'admin').length}
          </p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
        <Separator orientation="vertical" className="h-auto" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-bold text-slate-900">{authors.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Cari nama atau ID..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Author</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-slate-400">
                    Belum ada author. Klik &quot;Tambah Author&quot; untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                          {profile.display_name
                            ? profile.display_name[0].toUpperCase()
                            : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {profile.display_name ?? '(tanpa nama)'}
                          </p>
                          <p className="font-mono text-xs text-slate-400">
                            {profile.id.slice(0, 12)}…
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[profile.role] ?? ''} text-xs`}>
                        <Shield className="mr-1 h-3 w-3" />
                        {profile.role === 'admin' ? 'Admin' : 'Author'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 md:table-cell">
                      {formatDistanceToNow(new Date(profile.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit name */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          title="Edit nama"
                          onClick={() => openEditName(profile)}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        {/* Reset password */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-amber-600"
                          title="Reset password"
                          onClick={() => openReset(profile)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {/* Demote (only for non-admin) */}
                        {profile.role === 'author' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            title="Nonaktifkan sebagai author"
                            onClick={() => setDemoteTarget(profile)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ===== CREATE AUTHOR DIALOG ===== */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Tambah Author Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun baru dengan role author. Author dapat membuat dan mengelola
              materi serta artikel.
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="ca-name">Nama Tampil</Label>
              <Input
                id="ca-name"
                placeholder="Nama Author"
                {...createForm.register('displayName')}
                className={createForm.formState.errors.displayName ? 'border-red-400' : ''}
              />
              {createForm.formState.errors.displayName && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ca-email">Email</Label>
              <Input
                id="ca-email"
                type="email"
                placeholder="author@barakin.id"
                {...createForm.register('email')}
                className={createForm.formState.errors.email ? 'border-red-400' : ''}
              />
              {createForm.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ca-pw">Password</Label>
              <PasswordInput
                id="ca-pw"
                hasError={!!createForm.formState.errors.password}
                placeholder="Min. 8 karakter, huruf kapital & angka"
                {...createForm.register('password')}
              />
              {createForm.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ca-cpw">Konfirmasi Password</Label>
              <PasswordInput
                id="ca-cpw"
                hasError={!!createForm.formState.errors.confirmPassword}
                placeholder="Ulangi password"
                {...createForm.register('confirmPassword')}
              />
              {createForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <UserCheck className="mr-1.5 inline h-3.5 w-3.5" />
              Akun langsung aktif — author bisa masuk via <strong>/admin/login</strong> dengan
              email dan password di atas.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createForm.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createForm.formState.isSubmitting}
              >
                {createForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Buat Author
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== RESET PASSWORD DIALOG ===== */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(o) => { if (!o) { setResetTarget(null); setServerError(null); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Ubah password untuk{' '}
              <span className="font-semibold text-slate-900">
                {resetTarget?.display_name ?? 'author ini'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={resetForm.handleSubmit(handleReset)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Password Baru</Label>
              <PasswordInput
                hasError={!!resetForm.formState.errors.newPassword}
                placeholder="Min. 8 karakter, huruf kapital & angka"
                {...resetForm.register('newPassword')}
              />
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-red-500">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
              <PasswordInput
                hasError={!!resetForm.formState.errors.confirmPassword}
                placeholder="Ulangi password baru"
                {...resetForm.register('confirmPassword')}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setResetTarget(null); setServerError(null); }}
                disabled={resetForm.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600"
                disabled={resetForm.formState.isSubmitting}
              >
                {resetForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DISPLAY NAME DIALOG ===== */}
      <Dialog
        open={!!editNameTarget}
        onOpenChange={(o) => { if (!o) { setEditNameTarget(null); setServerError(null); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-blue-600" />
              Edit Nama
            </DialogTitle>
            <DialogDescription>
              Ubah nama tampil untuk{' '}
              <span className="font-semibold text-slate-900">
                {editNameTarget?.display_name ?? 'author ini'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={editNameForm.handleSubmit(handleEditName)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="en-name">Nama Tampil</Label>
              <Input
                id="en-name"
                placeholder="Nama baru"
                {...editNameForm.register('displayName')}
                className={editNameForm.formState.errors.displayName ? 'border-red-400' : ''}
              />
              {editNameForm.formState.errors.displayName && (
                <p className="text-xs text-red-500">
                  {editNameForm.formState.errors.displayName.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditNameTarget(null); setServerError(null); }}
                disabled={editNameForm.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={editNameForm.formState.isSubmitting}
              >
                {editNameForm.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== DEMOTE CONFIRM ===== */}
      <AlertDialog
        open={!!demoteTarget}
        onOpenChange={(o) => { if (!o) setDemoteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Author?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">
                {demoteTarget?.display_name}
              </span>{' '}
              akan diubah menjadi pengguna biasa dan tidak lagi bisa mengakses
              panel admin. Konten yang sudah dibuat tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemote}
              className="bg-red-600 hover:bg-red-700"
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
