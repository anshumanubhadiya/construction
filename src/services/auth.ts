// ─── Real Supabase Auth · signup / login / reset / profile ───
import { supabase } from './supabaseClient';
import type { Profile, Role } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export const CloudAuthError = {
  Invalid: 'Invalid email or password.',
  NotConfirmed: 'Please confirm your email first (check your inbox).',
  RateLimit: 'Too many attempts — wait a minute and try again.',
  Network: 'Cannot reach the server. Check your internet connection.',
};

function friendly(err: { message?: string } | null): string {
  const m = (err?.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return CloudAuthError.Invalid;
  if (m.includes('email not confirmed') || m.includes('not confirmed')) return CloudAuthError.NotConfirmed;
  if (m.includes('rate limit') || m.includes('too many')) return CloudAuthError.RateLimit;
  if (m.includes('failed to fetch') || m.includes('network')) return CloudAuthError.Network;
  return err?.message || 'Something went wrong. Please try again.';
}

export interface ProfileRow extends Profile {
  status: 'pending' | 'active' | 'rejected';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileFromRow(r: any): ProfileRow {
  const linked =
    r.role === 'worker' ? r.linked_worker_id : r.role === 'client' ? r.linked_client_id : null;
  return {
    id: String(r.id),
    name: r.name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    role: (['admin', 'staff', 'client', 'worker', 'supervisor'].includes(r.role)
      ? r.role : 'client') as Role,
    active: r.status === 'active',
    status: r.status === 'active' ? 'active' : r.status === 'rejected' ? 'rejected' : 'pending',
    linkedId: linked != null ? String(linked) : undefined,
    avatar: r.avatar_url || undefined,
    createdAt: r.created_at ?? '',
  };
}

export async function fetchMyProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? profileFromRow(data) : null;
}

export async function fetchAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(profileFromRow);
}

export async function cloudSignIn(email: string, password: string): Promise<ProfileRow> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(), password,
  });
  if (error) throw new Error(friendly(error));
  const me = await fetchMyProfile(data.user.id).catch(() => null);
  if (!me) {
    await supabase.auth.signOut();
    throw new Error('Account setup incomplete — please contact the owner.');
  }
  return me;
}

export interface CloudSignUpInput {
  name: string; phone: string; email: string; password: string;
  role: 'client' | 'worker' | 'supervisor' | 'staff';
  joinCode?: string;
}

export async function cloudSignUp(d: CloudSignUpInput): Promise<{
  needsConfirmation: boolean; profile: ProfileRow | null;
}> {
  const { data, error } = await supabase.auth.signUp({
    email: d.email.trim().toLowerCase(),
    password: d.password,
    options: {
      data: {
        name: d.name.trim(), phone: d.phone.trim(), role: d.role,
        join_code: (d.joinCode || '').trim().toUpperCase(),
      },
    },
  });
  if (error) throw new Error(friendly(error));
  if (!data.user) throw new Error('Signup failed — please try again.');
  // email confirmation off → session returned → we can load the profile now
  if (data.session) {
    const me = await fetchMyProfile(data.user.id).catch(() => null);
    return { needsConfirmation: false, profile: me };
  }
  return { needsConfirmation: true, profile: null };
}

export async function cloudSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<string> {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) throw new Error(friendly(error));
  return 'If this email is registered, a secure password-reset link is on its way. Open it on this device to continue.';
}

/** Called by /reset-password: finishes the PKCE link exchange, sets new password. */
export async function completePasswordReset(newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
  const { data: current } = await supabase.auth.getSession();
  if (!current.session) {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) throw new Error('Reset link is invalid or expired. Request a new one.');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error(friendly(error));
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(friendly(error));
}

/** Verified change-password: current password is checked server-side. */
export async function changeCloudPassword(email: string, current: string, next: string): Promise<void> {
  if (next.length < 8) throw new Error('New password must be at least 8 characters.');
  const { data: cur } = await supabase.auth.getSession();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(), password: current,
  });
  if (signInErr) throw new Error('Current password is incorrect.');
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw new Error(friendly(error));
  void cur; // new session stays active — no re-login needed
}

export async function updateCloudProfile(userId: string, patch: {
  name?: string; phone?: string; avatar_url?: string;
}): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}

// ── admin operations ──
export async function adminSetProfile(
  userId: string,
  patch: { status?: 'pending' | 'active' | 'rejected'; role?: Role; linked_worker_id?: number | null; linked_client_id?: number | null },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function adminCreateJoinCode(role: 'staff' | 'supervisor', maxUses: number): Promise<string> {
  const code = `SRV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { error } = await supabase.from('join_codes').insert({ code, role, max_uses: maxUses });
  if (error) throw new Error(error.message);
  return code;
}

export async function adminListJoinCodes(): Promise<{ code: string; role: string; max_uses: number; used_count: number }[]> {
  const { data, error } = await supabase.from('join_codes').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as unknown) as { code: string; role: string; max_uses: number; used_count: number }[]) || [];
}

/** true → first account ever: it becomes the owner automatically. */
export async function isFreshInstall(): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles').select('id', { count: 'exact', head: true });
  void data;
  if (error) return false;
  // head count not exposed by select({head}) here; cheap fallback:
  const { data: rows } = await supabase.from('profiles').select('id').limit(1);
  return !rows || rows.length === 0;
}
