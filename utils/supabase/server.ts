import { supabaseAdmin } from "./admin";

/**
 * Returns the Supabase service-role client for database operations.
 * Auth is now handled by JWT cookies — not Supabase Auth.
 */
export const createClient = async () => supabaseAdmin;
