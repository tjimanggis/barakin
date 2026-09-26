import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: any = null;

export function getSupabaseBrowser(): any {
  if (browserClient) return browserClient;
  // createBrowserClient from @supabase/ssr stores the session in cookies,
  // which makes it readable by the server-side middleware.
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
