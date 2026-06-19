import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — admin operations will fail");
}

export const supabaseAdmin = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder",
  { auth: { autoRefreshToken: false, persistSession: false } }
);
