import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createServerClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — safe to ignore if middleware refreshes sessions
          }
        },
      },
    }
  );
};
