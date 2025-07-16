import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function addEventFields() {
  try {
    console.log('Adding missing fields to events table...');
    
    // Add description field
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log('✅ description field added');
    
    // Add ticketPriceRange field
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS ticket_price_range VARCHAR(255)
    `);
    console.log('✅ ticket_price_range field added');
    
    // Add capacity field (move from venueInfo to top level)
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS capacity INTEGER
    `);
    console.log('✅ capacity field added');
    
    // Add organizer field
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS organizer VARCHAR(255)
    `);
    console.log('✅ organizer field added');
    
    // Add website field
    await db.execute(sql`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS website TEXT
    `);
    console.log('✅ website field added');
    
    console.log('\n✅ All fields added successfully!');
    
    await client.end();
  } catch (error) {
    console.error('❌ Error adding event fields:', error);
    await client.end();
    process.exit(1);
  }
}

addEventFields();