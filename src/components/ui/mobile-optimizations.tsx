'use client';

// =============================================================================
// HAULR AI ESTIMATOR — MOBILE OPTIMIZATION COMPONENTS
// Mobile-specific helpers for touch interactions and PWA UX
// =============================================================================

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// MOBILE FULLSCREEN WRAPPER
// Goes full-screen on mobile devices
// =============================================================================

interface MobileFullscreenProps {
  children: ReactNode;
  className?: string;
  enabled?: boolean;
}

export function MobileFullscreen({
  children,
  className,
  enabled = true,
}: MobileFullscreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const requestFullscreen = useCallback(async () => {
    if (!enabled || !ref.current) return;
    try {
      if (ref.current.requestFullscreen) {
        await ref.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, [enabled]);

  const exitFullscreen = useCallback(async () => {
    if (document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'w-full',
        isFullscreen && 'h-screen overflow-auto bg-white',
        className
      )}
    >
      {children}
      {enabled && (
        <button
          onClick={isFullscreen ? exitFullscreen : requestFullscreen}
          className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-white backdrop-blur-sm md:hidden"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// TOUCH FRIENDLY BUTTON
// Ensures minimum 44px touch target (WCAG 2.5.5)
// =============================================================================

interface TouchFriendlyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function TouchFriendlyButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: TouchFriendlyButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
    secondary:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  };

  const sizeClasses = {
    sm: 'min-h-[44px] px-3 py-2 text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[52px] px-6 py-3 text-base',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
        'touch-target transition-colors select-none',
        '-webkit-tap-highlight-color-transparent',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// =============================================================================
// SWIPEABLE CARD
// Card with swipe-to-action (left = delete/decline, right = accept/confirm)
// =============================================================================

interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: string;       // Tailwind bg class, e.g. "bg-red-500"
  textColor?: string;  // Tailwind text class
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftAction?: SwipeAction;  // Swipe right to reveal (destructive)
  rightAction?: SwipeAction; // Swipe left to reveal (confirmatory)
  className?: string;
  threshold?: number; // px to trigger action (default 80)
}

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className,
  threshold = 80,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [revealed, setRevealed] = useState<'left' | 'right' | null>(null);

  // Background color transitions
  const leftBg = useTransform(
    x,
    [0, threshold],
    ['rgba(239,68,68,0)', 'rgba(239,68,68,1)']
  );
  const rightBg = useTransform(
    x,
    [-threshold, 0],
    ['rgba(34,197,94,1)', 'rgba(34,197,94,0)']
  );

  // Icon opacity
  const leftIconOpacity = useTransform(x, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const rightIconOpacity = useTransform(x, [-threshold, -threshold * 0.5, 0], [1, 0.5, 0]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const offset = info.offset.x;

      if (offset > threshold && leftAction) {
        // Swiped right far enough — trigger left action
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        setRevealed('left');
        leftAction.onAction();
      } else if (offset < -threshold && rightAction) {
        // Swiped left far enough — trigger right action
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        setRevealed('right');
        rightAction.onAction();
      } else {
        // Not far enough — snap back
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    [x, threshold, leftAction, rightAction]
  );

  if (revealed) {
    return null; // Remove card after action
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Left action background (revealed on swipe right) */}
      {leftAction && (
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center px-6',
            leftAction.color
          )}
          style={{ opacity: leftIconOpacity }}
        >
          <div className={cn('flex items-center gap-2', leftAction.textColor ?? 'text-white')}>
            {leftAction.icon}
            <span className="text-sm font-semibold">{leftAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* Right action background (revealed on swipe left) */}
      {rightAction && (
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center justify-end px-6',
            rightAction.color
          )}
          style={{ opacity: rightIconOpacity }}
        >
          <div className={cn('flex items-center gap-2', rightAction.textColor ?? 'text-white')}>
            <span className="text-sm font-semibold">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative bg-white',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// PULL TO REFRESH
// Pull-down gesture to trigger a refresh callback
// =============================================================================

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number; // px to trigger refresh (default 80)
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'pulling' | 'releasing' | 'refreshing'>('idle');

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return;
      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPullDistance(0);
        setPhase('idle');
        return;
      }

      // Resistance: full distance up to threshold, half beyond
      const distance = dy < threshold ? dy : threshold + (dy - threshold) * 0.3;
      setPullDistance(Math.min(distance, threshold * 1.5));
      setPhase(dy >= threshold ? 'releasing' : 'pulling');
    },
    [isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setPhase('refreshing');
      setIsRefreshing(true);
      setPullDistance(40); // Keep indicator visible during refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setPhase('idle');
      }
    } else {
      setPullDistance(0);
      setPhase('idle');
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const indicatorProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = pullDistance > 8;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {shouldShowIndicator && (
        <div
          className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          <div className="flex items-center gap-2 text-blue-600">
            {phase === 'refreshing' ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 transition-transform"
                style={{
                  transform: `rotate(${indicatorProgress * 180}deg)`,
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            <span className="text-sm font-medium">
              {phase === 'refreshing'
                ? 'Refreshing...'
                : phase === 'releasing'
                ? 'Release to refresh'
                : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content shifted down during pull */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: phase === 'idle' ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
