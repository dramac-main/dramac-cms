// src/lib/error-logger.ts

interface ErrorLogEntry {
  message: string;
  stack?: string;
  componentStack?: string;
  module?: string;
  moduleSlug?: string;
  siteId?: string;
  url: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ErrorLoggerOptions {
  /** Maximum queue size before forcing flush */
  maxQueueSize?: number;
  /** Debounce time in ms before sending batch */
  debounceMs?: number;
}

class ErrorLogger {
  private queue: ErrorLogEntry[] = [];
  private isProcessing = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<ErrorLoggerOptions>;

  constructor(options: ErrorLoggerOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize ?? 10,
      debounceMs: options.debounceMs ?? 1000,
    };
  }

  /**
   * Log an error to the service
   */
  log(
    error: Error,
    context?: {
      module?: string;
      moduleSlug?: string;
      siteId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    // Only log in browser
    if (typeof window === 'undefined') return;

    const entry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...context,
    };

    this.queue.push(entry);

    // Force flush if queue is full
    if (this.queue.length >= this.options.maxQueueSize) {
      this.flush();
    } else {
      // Otherwise debounce
      this.scheduleFlush();
    }
  }

  /**
   * Log a custom message (not an Error object)
   */
  logMessage(
    message: string,
    level: 'error' | 'warn' | 'info' = 'error',
    metadata?: Record<string, unknown>
  ) {
    const error = new Error(message);
    error.name = level.toUpperCase();
    this.log(error, { metadata: { ...metadata, level } });
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flush(), this.options.debounceMs);
  }

  private async flush() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const logs = [...this.queue];
    this.queue = [];

    try {
      // Send batch to logging API
      for (const log of logs) {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log),
        });
      }
    } catch (err) {
      // Re-queue failed logs for retry
      this.queue.push(...logs);
      console.error('Failed to send error logs:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Force immediate flush of all queued errors
   */
  forceFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    return this.flush();
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Convenience function for quick logging
export function logError(
  error: Error | string,
  context?: {
    module?: string;
    moduleSlug?: string;
    siteId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const err = typeof error === 'string' ? new Error(error) : error;
  errorLogger.log(err, context);
}
