'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function Analytics() {
  // 프로덕션 환경에서만 Analytics와 Speed Insights 활성화
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return null;
  }
  
  return (
    <>
      {/* Vercel Analytics - 자동으로 페이지뷰와 이벤트 추적 */}
      <VercelAnalytics />
      
      {/* Vercel Speed Insights - Web Vitals 성능 모니터링 */}
      <SpeedInsights />
    </>
  );
}