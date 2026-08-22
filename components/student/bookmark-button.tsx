'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function BookmarkButton({ lessonId, initialBookmarked }: { lessonId: string, initialBookmarked: boolean }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function toggleBookmark() {
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ title: 'Perlu login', description: 'Silakan login untuk bookmark materi', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({ user_id: user.id, lesson_id: lessonId, bookmarked: !bookmarked }, { onConflict: 'user_id,lesson_id' });

    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      setBookmarked(!bookmarked);
      toast({ title: !bookmarked ? 'Materi dibookmark' : 'Bookmark dihapus' });
    }
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleBookmark} disabled={loading} className={bookmarked ? 'text-blue-600' : 'text-slate-400'}>
      <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
    </Button>
  );
}
