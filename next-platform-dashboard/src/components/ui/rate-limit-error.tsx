"use client";

import { Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

interface RateLimitErrorProps {
  retryAfter?: number; // seconds until reset
  type?: string; // type of rate-limited action
  message?: string; // custom message
  onRetry?: () => void; // callback when retry becomes available
  showCountdown?: boolean; // whether to show live countdown
}

function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setTimeout(() => {
      setSeconds((s) => {
        const newValue = s - 1;
        if (newValue === 0) {
          onCompleteRef.current?.();
        }
        return newValue;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  return seconds;
}

export function RateLimitError({
  retryAfter = 0,
  type = "requests",
  message,
  onRetry,
  showCountdown = true,
}: RateLimitErrorProps) {
  const countdown = useCountdown(
    showCountdown ? retryAfter : 0,
    onRetry
  );

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "now";
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
    if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const displayTime = showCountdown && countdown > 0 ? countdown : retryAfter;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Rate Limit Exceeded
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          {message ||
            `You've made too many ${type}. Please wait before trying again.`}
        </p>
        {displayTime && displayTime > 0 && (
          <p className="mt-2 text-sm font-medium">
            {showCountdown && countdown > 0 ? (
              <>
                Retry available in:{" "}
                <span className="font-mono tabular-nums">
                  {formatTime(countdown)}
                </span>
              </>
            ) : (
              <>
                Try again in <strong>{formatTime(displayTime)}</strong>
              </>
            )}
          </p>
        )}
        {onRetry && countdown === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Compact inline variant for toast-like displays
export function RateLimitErrorInline({
  retryAfter,
  type = "requests",
}: {
  retryAfter?: number;
  type?: string;
}) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <Clock className="h-4 w-4" />
      <span>
        Too many {type}.
        {retryAfter && retryAfter > 0 && (
          <> Retry in {formatTime(retryAfter)}.</>
        )}
      </span>
    </div>
  );
}
