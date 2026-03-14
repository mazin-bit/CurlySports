/**
 * Prints DATABASE_URL and DIRECT_URL with the password correctly URL-encoded.
 * Usage: DB_PASSWORD='your-raw-password' node scripts/encode-db-urls.js
 * Then paste the output into .env (replace existing DATABASE_URL and DIRECT_URL lines).
 */
const password = process.env.DB_PASSWORD;
if (!password) {
  console.error('Set DB_PASSWORD. Example: DB_PASSWORD=\'[N8t:C4W{&47;]\' node scripts/encode-db-urls.js');
  process.exit(1);
}
const encoded = encodeURIComponent(password);
const user = 'postgres.ialexnohsrkrkmbnuqgd';
const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
const db = 'postgres';
console.log('Add these to your .env:\n');
console.log(`DATABASE_URL="postgresql://${user}:${encoded}@${host}:6543/${db}?pgbouncer=true&sslmode=require"`);
console.log(`DIRECT_URL="postgresql://${user}:${encoded}@${host}:5432/${db}?sslmode=require"`);
console.log('');
