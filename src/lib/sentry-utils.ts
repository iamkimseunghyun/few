import * as Sentry from '@sentry/nextjs';

/**
 * API 에러를 Sentry에 보고하는 헬퍼 함수
 */
export function captureApiError(
  error: unknown,
  context: {
    endpoint?: string;
    method?: string;
    payload?: unknown;
    userId?: string;
  }
) {
  const errorContext = {
    api: {
      endpoint: context.endpoint,
      method: context.method,
      payload: context.payload,
    },
  };

  // 민감한 정보 제거
  if (errorContext.api.payload && typeof errorContext.api.payload === 'object') {
    const sanitized = { ...errorContext.api.payload };
    // 비밀번호, 토큰 등 제거
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        delete (sanitized as Record<string, unknown>)[key];
      }
    });
    errorContext.api.payload = sanitized;
  }

  Sentry.captureException(error, {
    contexts: errorContext,
    tags: {
      type: 'api_error',
      endpoint: context.endpoint,
    },
    user: context.userId ? { id: context.userId } : undefined,
  });
}

/**
 * 폼 유효성 검사 에러를 Sentry에 보고
 */
export function captureFormError(
  error: unknown,
  formName: string,
  validationErrors?: Record<string, string[]>
) {
  Sentry.captureException(error, {
    contexts: {
      form: {
        name: formName,
        validation_errors: validationErrors,
      },
    },
    tags: {
      type: 'form_error',
      form: formName,
    },
    level: 'warning',
  });
}

/**
 * 미디어 업로드 에러를 Sentry에 보고
 */
export function captureMediaError(
  error: unknown,
  context: {
    fileType?: string;
    fileSize?: number;
    uploadType?: 'image' | 'video';
    provider?: 'cloudinary' | 'cloudflare';
  }
) {
  Sentry.captureException(error, {
    contexts: {
      media: context,
    },
    tags: {
      type: 'media_error',
      provider: context.provider,
      upload_type: context.uploadType,
    },
  });
}

/**
 * 성능 문제를 Sentry에 보고
 */
export function capturePerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  metadata?: Record<string, unknown>
) {
  if (value > threshold) {
    Sentry.captureMessage(`Performance issue: ${metric}`, {
      level: 'warning',
      contexts: {
        performance: {
          metric,
          value,
          threshold,
          exceeded_by: value - threshold,
          ...metadata,
        },
      },
      tags: {
        type: 'performance',
        metric,
      },
    });
  }
}

/**
 * 사용자 피드백과 함께 에러 보고
 */
export function captureErrorWithFeedback(
  error: unknown,
  userFeedback?: {
    name?: string;
    email?: string;
    comments?: string;
  }
) {
  const eventId = Sentry.captureException(error);
  
  if (userFeedback && eventId) {
    const user = Sentry.getCurrentScope().getUser();
    Sentry.captureFeedback({
      name: userFeedback.name || user?.username || 'Anonymous',
      email: userFeedback.email || user?.email || 'unknown@example.com',
      message: userFeedback.comments || 'No comments provided',
      associatedEventId: eventId,
    });
  }
  
  return eventId;
}

/**
 * 브레드크럼 추가 헬퍼
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}