import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    // Return a stub client that won't crash the app when Supabase isn't configured
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
