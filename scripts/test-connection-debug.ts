import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || '';
console.log('Raw DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Parse the URL
try {
  const url = new URL(DATABASE_URL);
  console.log('Host:', url.hostname);
  console.log('Port:', url.port || '5432');
  console.log('Database:', url.pathname.slice(1));
  console.log('SSL mode:', url.searchParams.get('sslmode'));
} catch (e) {
  console.error('Invalid URL:', e);
}

// Test with a simple postgres connection
import postgres from 'postgres';

async function testDirect() {
  try {
    console.log('\nTesting direct postgres connection...');
    const sql = postgres(DATABASE_URL, {
      ssl: 'require',
      prepare: false,
      connect_timeout: 10,
    });
    
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Direct connection successful:', result);
    await sql.end();
  } catch (error) {
    console.error('❌ Direct connection failed:', error);
  }
}

testDirect();