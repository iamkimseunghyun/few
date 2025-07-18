"use client";

import { Component, ReactNode } from "react";
import { ErrorMessage } from "./ErrorMessage";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
  errorMessageTitle?: string;
  errorMessageText?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Sentry에 에러 보고
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'ErrorBoundary',
      },
    });
    
    // eventId 저장 (사용자 피드백 대화상자용)
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage
              title={this.props.errorMessageTitle || "예상치 못한 오류가 발생했습니다"}
              message={this.props.errorMessageText || "페이지를 새로고침하거나 잠시 후 다시 시도해주세요."}
              onRetry={() => window.location.reload()}
            />
            {this.props.showDialog && this.state.eventId && (
              <button
                onClick={() => {
                  Sentry.showReportDialog({ 
                    eventId: this.state.eventId,
                    title: "문제가 발생했나요?",
                    subtitle: "무엇이 잘못되었는지 알려주세요.",
                    subtitle2: "피드백은 서비스 개선에 큰 도움이 됩니다.",
                    labelName: "이름",
                    labelEmail: "이메일",
                    labelComments: "무엇이 일어났나요?",
                    labelClose: "닫기",
                    labelSubmit: "전송",
                    successMessage: "피드백을 보내주셔서 감사합니다!",
                  });
                }}
                className="mt-4 w-full text-center text-sm text-gray-600 hover:text-gray-900 underline"
              >
                오류 신고하기
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}