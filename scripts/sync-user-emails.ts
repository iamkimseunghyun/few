import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { users } from '../src/lib/db/schema';
import { createClerkClient } from '@clerk/backend';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function syncUserEmails() {
  const sql = postgres(DATABASE_URL!);
  const db = drizzle(sql);

  try {
    console.log('Syncing user emails from Clerk...');

    // Get all users from database
    const dbUsers = await db.select().from(users);

    let updatedCount = 0;

    for (const dbUser of dbUsers) {
      try {
        // Skip test users
        if (dbUser.id.startsWith('test_')) {
          console.log(`⏭️  Skipping test user: ${dbUser.id}`);
          continue;
        }
        
        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(dbUser.id);

        if (clerkUser.emailAddresses.length > 0) {
          const primaryEmail = clerkUser.emailAddresses.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
          )?.emailAddress;

          if (primaryEmail && dbUser.email !== primaryEmail) {
            // Update email in database
            await db
              .update(users)
              .set({ email: primaryEmail })
              .where(eq(users.id, dbUser.id));

            console.log(
              `✅ Updated email for user ${dbUser.username}: ${primaryEmail}`
            );
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to sync user ${dbUser.id}:`, error);
      }
    }

    console.log(`\n✅ Sync complete. Updated ${updatedCount} user emails.`);

    await sql.end();
  } catch (error) {
    console.error('Error syncing user emails:', error);
    await sql.end();
    process.exit(1);
  }
}

syncUserEmails();
