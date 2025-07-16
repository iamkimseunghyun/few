import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Test database connection
    const dbTest = await db.execute(sql`SELECT 1 as test`);
    
    // Test auth
    const { userId } = await auth();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      auth: userId ? 'authenticated' : 'anonymous',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}