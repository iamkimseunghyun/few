'use client';

import { type ReactElement, cloneElement, type ReactNode } from 'react';
import { TouchableOpacity } from './TouchableOpacity';
import { Ripple } from './Ripple';
import { cn } from '@/lib/utils';

interface TouchFeedbackProps {
  children: ReactElement;
  type?: 'opacity' | 'ripple' | 'both';
  disabled?: boolean;
  activeOpacity?: number;
  rippleColor?: string;
  className?: string;
}

export function TouchFeedback({
  children,
  type = 'both',
  disabled = false,
  activeOpacity = 0.7,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  className,
}: TouchFeedbackProps) {
  const showOpacity = type === 'opacity' || type === 'both';
  const showRipple = type === 'ripple' || type === 'both';

  if (showOpacity && !showRipple) {
    return (
      <TouchableOpacity
        className={className}
        activeOpacity={activeOpacity}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  if (showRipple) {
    interface ChildProps {
      className?: string;
      children?: ReactNode;
      [key: string]: unknown;
    }
    
    const childProps = children.props as ChildProps;
    const newProps: ChildProps = {
      ...childProps,
      className: cn(childProps.className, 'relative overflow-hidden'),
      children: (
        <>
          {childProps.children}
          <Ripple color={rippleColor} />
        </>
      ),
    };
    
    const wrappedChild = cloneElement(children, newProps);

    if (showOpacity) {
      return (
        <TouchableOpacity
          className={className}
          activeOpacity={activeOpacity}
          disabled={disabled}
        >
          {wrappedChild}
        </TouchableOpacity>
      );
    }

    return wrappedChild;
  }

  return children;
}