import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { users } from '@/lib/db';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function setAdminUser(emailOrUsername: string) {
  const sql = postgres(DATABASE_URL!);
  const db = drizzle(sql);

  try {
    // Try to find user by email or username
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, emailOrUsername))
      .limit(1);

    if (user.length === 0) {
      // Try by username if email didn't match
      const userByUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, emailOrUsername))
        .limit(1);

      if (userByUsername.length === 0) {
        console.error(
          `User not found with email or username: ${emailOrUsername}`
        );
        process.exit(1);
      }

      // Update user to admin
      await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, userByUsername[0].id));

      console.log(
        `✅ User ${userByUsername[0].username} (${userByUsername[0].email}) has been set as admin`
      );
    } else {
      // Update user to admin
      await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, user[0].id));

      console.log(
        `✅ User ${user[0].username} (${user[0].email}) has been set as admin`
      );
    }

    await sql.end();
  } catch (error) {
    console.error('Error setting admin user:', error);
    await sql.end();
    process.exit(1);
  }
}

// Get email/username from command line argument
const emailOrUsername = process.argv[2];

if (!emailOrUsername) {
  console.error('Usage: npm run set-admin <email-or-username>');
  console.error('Example: npm run set-admin admin@example.com');
  console.error('Example: npm run set-admin adminuser');
  process.exit(1);
}

setAdminUser(emailOrUsername);
