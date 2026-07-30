import { createBrowserClient } from "@supabase/ssr";

// Hardcoded because Turbopack/Next.js 16 does not inline NEXT_PUBLIC_* env vars
// in Vercel production builds. These are public client-side values (safe to expose).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xbswslbgrlhyqigpzdwz.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic3dzbGJncmxoeXFpZ3B6ZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI0MzksImV4cCI6MjA5NTEyODQzOX0.31dKgGujVd1HbrDYl2cq3pNY9FepXO9FfmkS--mXEIE";

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseKey);
};
