// ─── Supabase client · Auth + PostgREST + Storage (production project) ───
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

// Credentials come from .env in deployment; the fallbacks point at the live
// Sarvotam project so local dev just works.
export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ?? 'https://afcgjxndrtwifgghlhwx.supabase.co';
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY2dqeG5kcnR3aWZnZ2hsaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjk5NTMsImV4cCI6MjEwNDY0NTk1M30.LJI8RJ9ea3ahQBoSnDgnefx5zaSCdYAEiJrlU1gTJiU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});

export const PHOTO_BUCKET = 'site-progress-photos';
export const publicFileUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    apikey: SUPABASE_ANON_KEY,
    // real user token → RLS policies apply to every query
    Authorization: `Bearer ${data.session?.access_token ?? SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function qs(params?: string) {
  return params ? `&${params}` : '';
}

async function run(res: Response) {
  if (res.status === 204) return null;
  let body: Row | Row[] | null = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const msg =
      (body && !Array.isArray(body) && (body.message as string)) ||
      `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { code?: string };
    err.code = body && !Array.isArray(body) ? (body.code as string) : undefined;
    throw err;
  }
  return body;
}

// The classic api.get/post/patch/delete pattern — now session-aware.
export const api = {
  async get(table: string, params?: string) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.desc&limit=5000${qs(params)}`,
      { headers: await authHeaders() },
    );
    return (await run(res)) as Row[] | null;
  },
  async post(table: string, obj: Row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      method: 'POST',
      headers: await authHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(obj),
    });
    const rows = (await run(res)) as Row[] | null;
    return rows?.[0] ?? null;
  },
  async patch(table: string, id: string | number, obj: Row) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}&select=*`, {
      method: 'PATCH',
      headers: await authHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(obj),
    });
    const rows = (await run(res)) as Row[] | null;
    return rows?.[0] ?? null;
  },
  async remove(table: string, filter: string) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    return run(res);
  },
  async delete(table: string, id: string | number) {
    return api.remove(table, `id=eq.${id}`);
  },
};
