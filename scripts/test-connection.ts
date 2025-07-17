import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log(
  'DATABASE_URL:',
  process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')
);

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Connection successful:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
