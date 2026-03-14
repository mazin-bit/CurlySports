import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
    console.log('Testing Supabase signup manually to check if email confirmation works...');

    // Use a random email to ensure it's a new user
    const testEmail = `testuser_${Math.random().toString(36).substring(7)}@example.com`;
    const testPassword = 'Password123!';

    console.log(`Attempting to sign up with: ${testEmail}`);

    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    });

    if (error) {
        console.error('\nSignup failed with error:');
        console.error(error.message);
    } else {
        console.log('\nSignup successful!');
        console.log('User data:', data.user?.id);
        console.log('Please check if the "Error sending confirmation email" is gone!');
    }
}

testSignup();
