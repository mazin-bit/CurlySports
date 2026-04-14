import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjruailpomnruncmuhzn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnVhaWxwb21ucnVuY211aHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTI3ODQsImV4cCI6MjA4ODUyODc4NH0.zKNKIRrFyMqTfms1vWvDrJHxlLBr6b5dJDh_MUTo7bw';

export const supabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
