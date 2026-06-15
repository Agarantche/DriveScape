import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True once you've added your Supabase project URL + anon key to frontend/.env.
export const isSupabaseConfigured = Boolean(url && anonKey);

// Null until configured — the app stays fully usable (just without real auth) in the meantime.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
