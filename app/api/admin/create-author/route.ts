import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

// Only available server-side — never exposed to the client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(request: NextRequest) {
  // 1. Verify the calling user is an admin
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Parse body
  const body = await request.json().catch(() => null);
  const { email, password, displayName } = body ?? {};

  if (!email || !password || !displayName) {
    return NextResponse.json(
      { error: 'email, password, dan nama wajib diisi' },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password minimal 8 karakter' },
      { status: 400 },
    );
  }

  // 3. Create the auth user with admin API
  const { data: newUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // immediately confirmed, no email needed
      user_metadata: { full_name: displayName },
    });

  if (createError) {
    const msg = createError.message.includes('already registered')
      ? 'Email sudah terdaftar.'
      : createError.message;
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // 4. Set role to 'author' via the privileged RPC
  //    (handle_new_user trigger already created the profile row)
  const { error: roleError } = await supabase.rpc('set_user_role', {
    p_target_user: newUser.user!.id,
    p_role: 'author',
  });

  if (roleError) {
    // Created but role update failed — not catastrophic, admin can fix via users page
    return NextResponse.json(
      {
        warning: `Akun dibuat tapi gagal set role author: ${roleError.message}`,
        userId: newUser.user!.id,
      },
      { status: 207 },
    );
  }

  return NextResponse.json({
    message: 'Author berhasil dibuat',
    userId: newUser.user!.id,
  });
}
