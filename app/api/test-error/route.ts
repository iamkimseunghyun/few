import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // 의도적으로 에러 발생
    throw new Error('Test error for Sentry');
  } catch (error) {
    // Sentry에 수동으로 에러 보고
    Sentry.captureException(error, {
      tags: {
        test: true,
        endpoint: '/api/test-error',
      },
    });
    
    return NextResponse.json(
      { error: 'Test error occurred and sent to Sentry' },
      { status: 500 }
    );
  }
}