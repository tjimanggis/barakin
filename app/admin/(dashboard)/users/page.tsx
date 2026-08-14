'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, User, PenSquare, Loader2, RefreshCw } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const roleColors: Record<UserRole, string> = {
  admin: 'bg-rose-50 text-rose-700 border-rose-200',
  author: 'bg-violet-50 text-violet-700 border-violet-200',
  user: 'bg-slate-100 text-slate-600 border-slate-200',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  author: 'Author',
  user: 'Pengguna',
};

export default function AdminUsersPage() {
  const supabase = getSupabaseBrowser();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Edit role dialog
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [saving, setSaving] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    let result = profiles;
    if (roleFilter !== 'all') {
      result = result.filter((p) => p.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.display_name?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [profiles, search, roleFilter]);

  function openEdit(profile: Profile) {
    setEditTarget(profile);
    setNewRole(profile.role);
  }

  async function saveRole() {
    if (!editTarget) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('set_user_role', {
      p_target_user: editTarget.id,
      p_role: newRole,
    });
    setSaving(false);

    if (error) {
      toast({
        title: 'Gagal mengubah role',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Role berhasil diubah' });
      setProfiles((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...p, role: newRole } : p)),
      );
      setEditTarget(null);
    }
  }

  const counts = {
    all: profiles.length,
    admin: profiles.filter((p) => p.role === 'admin').length,
    author: profiles.filter((p) => p.role === 'author').length,
    user: profiles.filter((p) => p.role === 'user').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola role dan akses pengguna terdaftar.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProfiles}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'admin', 'author', 'user'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              roleFilter === r
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {r === 'all' ? 'Semua' : roleLabels[r as UserRole]}{' '}
            <span className="ml-1 opacity-70">{counts[r]}</span>
          </button>
        ))}
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
                <TableHead>Pengguna</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-slate-400">
                    Tidak ada pengguna ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {profile.display_name
                            ? profile.display_name[0].toUpperCase()
                            : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {profile.display_name ?? '(tanpa nama)'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {profile.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${roleColors[profile.role]} text-xs`}>
                        <Shield className="mr-1 h-3 w-3" />
                        {roleLabels[profile.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 md:table-cell">
                      {formatDistanceToNow(new Date(profile.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(profile)}
                        className="text-slate-500 hover:text-blue-600"
                      >
                        <PenSquare className="h-4 w-4" />
                        <span className="sr-only">Edit role</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role untuk{' '}
              <span className="font-semibold text-slate-900">
                {editTarget?.display_name ?? 'pengguna ini'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Pengguna</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-slate-500">
              Admin dapat mengelola semua konten dan pengguna. Author dapat
              membuat dan mengedit materi serta artikel.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={saveRole}
              disabled={saving || newRole === editTarget?.role}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
