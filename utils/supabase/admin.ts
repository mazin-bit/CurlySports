import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-init to avoid crashing at build time when env vars are missing
let _client: SupabaseClient | null = null;

/**
 * Derive the Supabase project URL from DATABASE_URL.
 * DATABASE_URL format: postgresql://postgres.PROJECT_ID:password@host:port/db
 * Supabase URL format: https://PROJECT_ID.supabase.co
 */
function deriveSupabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL || "";
  const match = dbUrl.match(/postgres(?:ql)?:\/\/postgres\.([^:]+):/);
  if (match?.[1]) return `https://${match[1]}.supabase.co`;
  return "";
}

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || deriveSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!url || !key) {
      throw new Error(
        `supabaseAdmin: missing env vars — URL=${url ? "set" : "MISSING"} (tried SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, derived from DATABASE_URL), SUPABASE_SERVICE_ROLE_KEY=${key ? "set" : "MISSING"}`
      );
    }
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
