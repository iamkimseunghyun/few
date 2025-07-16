import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const queryClient = postgres(process.env.DATABASE_URL);
const db = drizzle(queryClient);

async function addAdminColumn() {
  try {
    console.log('Adding isAdmin column to users table...');
    
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL
    `);
    
    console.log('✅ Successfully added isAdmin column');
    
    // 특정 사용자를 관리자로 설정하려면 아래 주석을 해제하고 사용자 ID를 입력하세요
    // await db.execute(sql`
    //   UPDATE users 
    //   SET is_admin = true 
    //   WHERE id = 'your-clerk-user-id'
    // `);
    
  } catch (error) {
    console.error('❌ Error adding isAdmin column:', error);
  } finally {
    await queryClient.end();
  }
}

addAdminColumn();