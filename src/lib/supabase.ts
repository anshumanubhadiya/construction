// ─── Supabase connection flag ───
// The live client + credentials live in src/services/supabaseClient.ts.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../services/supabaseClient';

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
