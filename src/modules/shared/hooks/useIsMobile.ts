import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkIsMobile = () => {
      // Check if we're in a React Native WebView
      const isWebView =
        window.ReactNativeWebView !== undefined ||
        navigator.userAgent.includes('wv') ||
        navigator.userAgent.includes('WebView');

      // Check screen width
      const isSmallScreen = window.innerWidth < breakpoint;

      // Check if it's a touch device
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isWebView || (isSmallScreen && isTouchDevice));
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  // Return false during SSR
  return isClient ? isMobile : false;
}

// Hook to detect if running in React Native WebView
export function useIsWebView() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const checkWebView =
      window.ReactNativeWebView !== undefined ||
      navigator.userAgent.includes('wv') ||
      navigator.userAgent.includes('WebView');

    setIsWebView(checkWebView);
  }, []);

  return isWebView;
}
