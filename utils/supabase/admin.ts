import { createClient, SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_ vars are inlined into client bundles at build time but may not
// be in process.env on the server at runtime. Fall back to SUPABASE_URL.
function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}
function getKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

// Lazy-init to avoid crashing at build time when env vars are missing
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = getUrl();
    const key = getKey();
    if (!url || !key) {
      throw new Error(
        `supabaseAdmin: missing env vars — url=${url ? "set" : "MISSING (set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL)"}, key=${key ? "set" : "MISSING (set SUPABASE_SERVICE_ROLE_KEY)"}`
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
