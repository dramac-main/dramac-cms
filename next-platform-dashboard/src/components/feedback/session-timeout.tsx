"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogOut, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

// =============================================================================
// SESSION TIMEOUT CONTEXT
// =============================================================================

export interface SessionTimeoutContextValue {
  /**
   * Remaining session time in seconds
   */
  remainingTime: number;
  /**
   * Whether the warning dialog is visible
   */
  showWarning: boolean;
  /**
   * Extend the session
   */
  extendSession: () => void;
  /**
   * Log out immediately
   */
  logout: () => void;
  /**
   * Reset the session timer (call on user activity)
   */
  resetTimer: () => void;
  /**
   * Session timeout duration in seconds
   */
  timeoutDuration: number;
  /**
   * Warning threshold in seconds (when to show warning)
   */
  warningThreshold: number;
}

const SessionTimeoutContext = React.createContext<SessionTimeoutContextValue | undefined>(
  undefined
);

// =============================================================================
// SESSION TIMEOUT PROVIDER
// =============================================================================

export interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  /**
   * Session timeout duration in seconds (default: 30 minutes)
   */
  timeoutDuration?: number;
  /**
   * Warning threshold in seconds before timeout (default: 5 minutes)
   */
  warningThreshold?: number;
  /**
   * Callback when session expires
   */
  onTimeout: () => void;
  /**
   * Callback when session is extended
   */
  onExtend?: () => void;
  /**
   * Whether to track user activity (mouse, keyboard)
   */
  trackActivity?: boolean;
  /**
   * Debounce time for activity tracking in ms
   */
  activityDebounce?: number;
  /**
   * Whether session timeout is enabled
   */
  enabled?: boolean;
}

/**
 * SessionTimeoutProvider - Manages session timeout with warning dialog.
 * 
 * @example
 * ```tsx
 * <SessionTimeoutProvider
 *   timeoutDuration={30 * 60} // 30 minutes
 *   warningThreshold={5 * 60} // 5 minutes warning
 *   onTimeout={() => signOut()}
 *   onExtend={() => refreshToken()}
 *   trackActivity
 * >
 *   <App />
 * </SessionTimeoutProvider>
 * ```
 */
export function SessionTimeoutProvider({
  children,
  timeoutDuration = 30 * 60, // 30 minutes
  warningThreshold = 5 * 60, // 5 minutes
  onTimeout,
  onExtend,
  trackActivity = true,
  activityDebounce = 10000, // 10 seconds
  enabled = true,
}: SessionTimeoutProviderProps) {
  const [remainingTime, setRemainingTime] = React.useState(timeoutDuration);
  const [showWarning, setShowWarning] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Reset timer
  const resetTimer = React.useCallback(() => {
    setRemainingTime(timeoutDuration);
    setShowWarning(false);
    lastActivityRef.current = Date.now();
  }, [timeoutDuration]);

  // Extend session
  const extendSession = React.useCallback(() => {
    resetTimer();
    onExtend?.();
  }, [resetTimer, onExtend]);

  // Logout
  const logout = React.useCallback(() => {
    setShowWarning(false);
    onTimeout();
  }, [onTimeout]);

  // Activity handler with debounce
  const handleActivity = React.useCallback(() => {
    if (!trackActivity) return;
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastActivityRef.current > activityDebounce) {
        resetTimer();
      }
    }, activityDebounce);
  }, [trackActivity, activityDebounce, resetTimer]);

  // Setup activity listeners
  React.useEffect(() => {
    if (!enabled || !trackActivity) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [enabled, trackActivity, handleActivity]);

  // Countdown timer
  React.useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        
        // Show warning when threshold reached
        if (newTime <= warningThreshold && newTime > 0 && !showWarning) {
          setShowWarning(true);
        }
        
        // Timeout reached
        if (newTime === 0) {
          logout();
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, warningThreshold, showWarning, logout]);

  const value = React.useMemo<SessionTimeoutContextValue>(
    () => ({
      remainingTime,
      showWarning,
      extendSession,
      logout,
      resetTimer,
      timeoutDuration,
      warningThreshold,
    }),
    [remainingTime, showWarning, extendSession, logout, resetTimer, timeoutDuration, warningThreshold]
  );

  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
      <SessionTimeoutDialog />
    </SessionTimeoutContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * useSessionTimeout - Access session timeout context.
 */
export function useSessionTimeout(): SessionTimeoutContextValue {
  const context = React.useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error("useSessionTimeout must be used within a SessionTimeoutProvider");
  }
  return context;
}

// =============================================================================
// SESSION TIMEOUT DIALOG
// =============================================================================

function SessionTimeoutDialog() {
  const context = React.useContext(SessionTimeoutContext);
  
  if (!context) return null;
  
  const { showWarning, remainingTime, extendSession, logout, warningThreshold } = context;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (remainingTime / warningThreshold) * 100;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Session Expiring</DialogTitle>
              <DialogDescription>
                Your session will expire soon due to inactivity.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center">
            <motion.div
              key={remainingTime}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "text-4xl font-bold tabular-nums",
                remainingTime <= 60 && "text-destructive"
              )}
            >
              {formatTime(remainingTime)}
            </motion.div>
            <p className="text-sm text-muted-foreground mt-1">
              Time remaining
            </p>
          </div>

          <Progress value={progress} className="h-2" />

          <p className="text-sm text-muted-foreground text-center">
            Click &quot;Stay Signed In&quot; to continue your session.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button onClick={extendSession}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// SESSION TIMEOUT BANNER
// =============================================================================

export interface SessionTimeoutBannerProps {
  className?: string;
  onDismiss?: () => void;
}

/**
 * SessionTimeoutBanner - Inline banner for session timeout warning.
 */
export function SessionTimeoutBanner({ className, onDismiss }: SessionTimeoutBannerProps) {
  const context = React.useContext(SessionTimeoutContext);
  
  if (!context || !context.showWarning) return null;
  
  const { remainingTime, extendSession } = context;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-50 shadow-lg",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Session expires in {formatTime(remainingTime)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-amber-50 hover:text-amber-100 hover:bg-amber-600"
            onClick={extendSession}
          >
            <RefreshCcw className="mr-1 h-3 w-3" />
            Extend Session
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-amber-50 hover:text-amber-100 hover:bg-amber-600"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// IDLE TIMER HOOK
// =============================================================================

export interface UseIdleTimerOptions {
  /**
   * Idle timeout in milliseconds
   */
  timeout: number;
  /**
   * Callback when user becomes idle
   */
  onIdle: () => void;
  /**
   * Callback when user becomes active
   */
  onActive?: () => void;
  /**
   * Events to track
   */
  events?: string[];
  /**
   * Whether to start immediately
   */
  startOnMount?: boolean;
}

/**
 * useIdleTimer - Hook for tracking user idle state.
 * 
 * @example
 * ```tsx
 * const { isIdle, start, stop, reset } = useIdleTimer({
 *   timeout: 5 * 60 * 1000, // 5 minutes
 *   onIdle: () => showIdleWarning(),
 *   onActive: () => hideIdleWarning(),
 * });
 * ```
 */
export function useIdleTimer({
  timeout,
  onIdle,
  onActive,
  events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"],
  startOnMount = true,
}: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(startOnMount);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = React.useRef<number>(Date.now());

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    lastActiveRef.current = Date.now();

    if (isIdle) {
      setIsIdle(false);
      onActive?.();
    }

    if (isRunning) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
        onIdle();
      }, timeout);
    }
  }, [isIdle, isRunning, onIdle, onActive, timeout]);

  const handleActivity = React.useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const start = React.useCallback(() => {
    setIsRunning(true);
    resetTimer();
  }, [resetTimer]);

  const stop = React.useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const reset = React.useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Setup event listeners
  React.useEffect(() => {
    if (!isRunning) return;

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, timeout);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, events, handleActivity, onIdle, timeout]);

  return {
    isIdle,
    isRunning,
    lastActive: lastActiveRef.current,
    start,
    stop,
    reset,
  };
}

export { SessionTimeoutDialog };
