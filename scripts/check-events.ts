import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { events } from '../src/lib/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function checkEvents() {
  const sql = postgres(DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Get all events
    const allEvents = await db.select().from(events);
    console.log('Total events:', allEvents.length);
    
    // Show first few events
    console.log('\nFirst 3 events:');
    allEvents.slice(0, 3).forEach(event => {
      console.log({
        id: event.id,
        name: event.name,
        dates: event.dates,
        category: event.category,
        location: event.location
      });
    });
    
    // Check events with dates
    const eventsWithDates = allEvents.filter(e => e.dates?.start);
    console.log('\nEvents with dates:', eventsWithDates.length);
    
    // Check current month events
    const now = new Date();
    const currentMonthEvents = eventsWithDates.filter(e => {
      const eventDate = new Date(e.dates!.start);
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear();
    });
    console.log('\nCurrent month events:', currentMonthEvents.length);
    
    await sql.end();
  } catch (err) {
    console.error('Error checking events:', err);
    await sql.end();
    process.exit(1);
  }
}

checkEvents();