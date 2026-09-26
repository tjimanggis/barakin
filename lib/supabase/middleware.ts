import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase: any = createServerClient<any>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isStudentRoute = pathname.startsWith('/dashboard');
  const isAdminLogin = pathname === '/admin/login';

  if (!user && (isAdminRoute || isStudentRoute) && !isAdminLogin) {
    const redirectUrl = isAdminRoute ? '/admin/login' : '/login';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role ?? 'user';

    if (isAdminRoute && !isAdminLogin && role !== 'admin' && role !== 'author') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isAdminLogin && (role === 'admin' || role === 'author')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return supabaseResponse;
}
