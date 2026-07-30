import { createBrowserClient } from "@supabase/ssr";

// Hardcoded: Turbopack inlines empty NEXT_PUBLIC_* env vars at build time on Vercel,
// making || fallbacks dead code. These are public client-side values (safe to expose).
const supabaseUrl = "https://xbswslbgrlhyqigpzdwz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhic3dzbGJncmxoeXFpZ3B6ZHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTI0MzksImV4cCI6MjA5NTEyODQzOX0.31dKgGujVd1HbrDYl2cq3pNY9FepXO9FfmkS--mXEIE";

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseKey);
};
