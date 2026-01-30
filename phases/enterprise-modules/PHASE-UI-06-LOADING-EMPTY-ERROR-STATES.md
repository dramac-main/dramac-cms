# PHASE-UI-06: Loading, Empty & Error States

## Objective
Implement comprehensive loading, empty, and error state components to provide consistent feedback throughout the DRAMAC CMS platform.

## Prerequisites
- PHASE-UI-05A and PHASE-UI-05B complete
- Base UI component library in place
- Framer Motion installed

## Components to Implement

### 1. Loading States

#### 1.1 PageLoader
Full-page loading indicator with branding.

```typescript
interface PageLoaderProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}
```

#### 1.2 ContentLoader
Section-level loading with skeleton previews.

```typescript
interface ContentLoaderProps {
  variant: "table" | "grid" | "list" | "card" | "form";
  count?: number;
  animated?: boolean;
}
```

#### 1.3 InlineLoader
Inline/button loading states.

```typescript
interface InlineLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}
```

### 2. Empty States

#### 2.1 EmptyState
Configurable empty state with illustration.

```typescript
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: "search" | "data" | "folder" | "inbox" | "custom";
  size?: "sm" | "md" | "lg";
}
```

#### 2.2 NoResults
Search-specific empty state.

```typescript
interface NoResultsProps {
  query?: string;
  suggestions?: string[];
  onClearSearch?: () => void;
}
```

### 3. Error States

#### 3.1 ErrorBoundary
React error boundary with fallback UI.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  resetKeys?: unknown[];
}
```

#### 3.2 ErrorState
Configurable error display.

```typescript
interface ErrorStateProps {
  error?: Error | string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showDetails?: boolean;
  severity?: "error" | "warning" | "info";
}
```

#### 3.3 OfflineIndicator
Network status indicator.

```typescript
interface OfflineIndicatorProps {
  showBanner?: boolean;
  onRetry?: () => void;
}
```

### 4. Feedback Components

#### 4.1 ConfirmDialog
Reusable confirmation dialog.

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive";
  loading?: boolean;
}
```

#### 4.2 Toast Enhancement
Enhanced toast notifications.

- Success/error/warning/info variants
- Progress indicator support
- Action buttons
- Auto-dismiss with hover pause

### 5. Form Validation States

#### 5.1 FormFieldError
Field-level error display.

```typescript
interface FormFieldErrorProps {
  error?: string;
  touched?: boolean;
  showIcon?: boolean;
}
```

#### 5.2 FormSummaryError
Form-level error summary.

```typescript
interface FormSummaryErrorProps {
  errors: Record<string, string>;
  title?: string;
}
```

## File Structure
```
src/components/feedback/
├── index.ts
├── page-loader.tsx
├── content-loader.tsx
├── inline-loader.tsx
├── empty-state.tsx
├── no-results.tsx
├── error-boundary.tsx
├── error-state.tsx
├── offline-indicator.tsx
├── confirm-dialog.tsx
├── form-field-error.tsx
└── form-summary-error.tsx
```

## Implementation Notes

1. **Skeleton Loading**
   - Use consistent border radius
   - Match actual content dimensions
   - Subtle pulse animation
   - Support for dark mode

2. **Error Handling**
   - Log errors to monitoring service
   - Provide actionable recovery options
   - Show technical details in development
   - User-friendly messages in production

3. **Animation**
   - Fade in/out transitions
   - Stagger for lists
   - Reduced motion support

4. **Accessibility**
   - ARIA live regions for dynamic content
   - Focus management in modals
   - Screen reader announcements

## Testing Checklist
- [ ] All loading states render correctly
- [ ] Empty states show appropriate content
- [ ] Error boundary catches errors
- [ ] Error states display proper messages
- [ ] Offline indicator detects network status
- [ ] Confirm dialog handles async operations
- [ ] Form errors display correctly
- [ ] Animations respect reduced motion

## Integration Points
- Dashboard widgets use loading states
- Data tables use content loaders
- Forms use validation states
- Global error boundary at app level
- Toast system for notifications

## Success Criteria
1. Consistent loading experience across all pages
2. Informative empty states guide users
3. Errors are caught and displayed gracefully
4. Users always know the system state
5. Recovery options are clear and accessible
