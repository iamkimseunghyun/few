import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function addEmailField() {
  try {
    console.log('Adding email field to users table...');
    
    // Add email column
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE
    `);
    
    console.log('✅ Email field added successfully');
    
    // Create index on email for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    
    console.log('✅ Email index created successfully');
    
    await client.end();
  } catch (error) {
    console.error('❌ Error adding email field:', error);
    await client.end();
    process.exit(1);
  }
}

addEmailField();