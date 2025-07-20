'use client';

import { useCallback, useRef, useEffect, MouseEventHandler } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
  isOpen?: boolean;
}

export function Modal({ 
  children, 
  onClose,
  className,
  showCloseButton = true,
  isOpen = true
}: ModalProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const onDismiss = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [router, onClose]);

  const onClick: MouseEventHandler = useCallback(
    (e) => {
      if (e.target === overlay.current) {
        onDismiss();
      }
    },
    [onDismiss, overlay]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [onKeyDown, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={wrapper}
        className={cn(
          "relative w-full h-[85vh] bg-transparent rounded-2xl overflow-hidden flex shadow-2xl animate-modalSlideUp",
          "max-w-7xl",
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 z-[110] p-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:scale-110 transition-all duration-200 shadow-lg"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}