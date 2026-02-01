# PHASE-EH-06: Offline & Rate Limiting

## Overview

Implement comprehensive offline handling, rate limiting feedback, retry mechanisms, and optimistic updates with rollback capabilities for the DRAMAC CMS platform.

## Dependencies

- **PHASE-EH-01**: Core Error Infrastructure (ActionResult types, error logging)
- **PHASE-EH-02**: Toast/Notification System (user feedback)
- **PHASE-EH-04**: Loading & Empty States (loading states)
- **PHASE-EH-05**: Dialogs & Warnings (confirmation dialogs)

## Implementation Files

### 1. Rate Limit Feedback (`src/lib/rate-limit.ts`)
Client-side rate limiting utilities and hooks:
- `RateLimiter` class for tracking rate limits
- `useRateLimitedAction` hook for rate-limited operations
- `useRateLimitStatus` hook for monitoring rate limit state
- Visual feedback for rate limit warnings
- Automatic retry scheduling

### 2. Retry Mechanisms (`src/lib/retry.ts`)
Robust retry logic with exponential backoff:
- `retry` utility with configurable options
- `useRetry` hook for component-level retries
- `RetryableOperation` component
- Circuit breaker pattern implementation
- Automatic failure detection

### 3. Optimistic Updates (`src/hooks/use-optimistic.ts`)
Optimistic update patterns with rollback:
- `useOptimisticMutation` hook
- `useOptimisticList` hook for list operations
- Automatic rollback on failure
- Conflict resolution strategies
- Sync state management

### 4. Enhanced Offline Components (`src/components/feedback/offline-handler.tsx`)
Advanced offline handling:
- `OfflineQueue` for queuing operations
- `SyncStatus` indicator
- `PendingChanges` display
- Auto-sync on reconnection
- Conflict resolution UI

## Technical Specifications

### Rate Limiting
```typescript
interface RateLimitConfig {
  limit: number;        // Max requests
  windowMs: number;     // Time window in ms
  key?: string;         // Unique identifier
  onLimit?: () => void; // Callback when limited
}
```

### Retry Configuration
```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}
```

### Optimistic Update
```typescript
interface OptimisticConfig<T> {
  onMutate: (variables: T) => Promise<unknown>;
  onSuccess?: (data: unknown, variables: T) => void;
  onError?: (error: Error, variables: T, context: unknown) => void;
  onSettled?: () => void;
  rollbackOnError?: boolean;
}
```

## Integration Points

1. **TanStack Query Integration**: Hooks work with existing query infrastructure
2. **Toast Notifications**: Rate limit and retry feedback via toast system
3. **Error Boundaries**: Fallback to error states on repeated failures
4. **Loading States**: Visual feedback during retries

## Testing Requirements

- [ ] Rate limiting triggers after threshold
- [ ] Retry attempts with exponential backoff
- [ ] Optimistic updates reflect immediately
- [ ] Rollback restores previous state on failure
- [ ] Offline queue persists across page reloads
- [ ] Auto-sync triggers on reconnection

## Success Criteria

1. Rate limiting provides clear feedback without blocking UX
2. Retry mechanisms recover gracefully from transient failures
3. Optimistic updates provide instant feedback
4. Offline mode maintains full functionality with sync
5. Zero data loss during offline/online transitions
