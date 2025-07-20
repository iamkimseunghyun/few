'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sendGAEvent } from '@next/third-parties/google';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Google Analytics로 Web Vitals 전송
    if (typeof window !== 'undefined' && window.gtag) {
      sendGAEvent('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_name: metric.name,
        metric_value: metric.value,
      });
    }

    // 콘솔에 Web Vitals 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }

    // 성능이 나쁜 경우 Sentry로 전송
    if (metric.rating === 'poor') {
      const sentryReady = window.Sentry;
      if (sentryReady) {
        sentryReady.captureMessage(`Poor Web Vital: ${metric.name}`, {
          level: 'warning',
          tags: {
            metric_name: metric.name,
            metric_id: metric.id,
            metric_rating: metric.rating,
          },
          extra: {
            value: metric.value,
            delta: metric.delta,
            navigationType: metric.navigationType,
          },
        });
      }
    }
  });

  return null;
}