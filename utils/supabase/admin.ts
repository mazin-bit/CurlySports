import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-init to avoid crashing at build time when env vars are missing
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!url || !key) {
      throw new Error(
        `supabaseAdmin: missing env vars — NEXT_PUBLIC_SUPABASE_URL=${url ? "set" : "MISSING"}, SUPABASE_SERVICE_ROLE_KEY=${key ? "set" : "MISSING"}`
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
