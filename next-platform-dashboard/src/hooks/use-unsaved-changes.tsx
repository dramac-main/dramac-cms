"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// =============================================================================
// USE UNSAVED CHANGES HOOK
// =============================================================================

export interface UseUnsavedChangesOptions {
  /**
   * Whether there are unsaved changes
   */
  hasChanges: boolean;
  /**
   * Custom warning message
   */
  message?: string;
  /**
   * Callback before leaving (return false to prevent)
   */
  onBeforeLeave?: () => boolean | Promise<boolean>;
  /**
   * Callback when user confirms leaving
   */
  onConfirmLeave?: () => void;
  /**
   * Enable/disable the warning (default: true when hasChanges)
   */
  enabled?: boolean;
}

/**
 * useUnsavedChanges - Hook for warning users about unsaved changes.
 * 
 * Handles:
 * - Browser back/forward navigation
 * - Tab/window close
 * - Page refresh
 * - Link navigation (via router events when available)
 * 
 * @example
 * ```tsx
 * const [formData, setFormData] = useState(initialData);
 * const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
 * 
 * const { setConfirmed, ConfirmDialog } = useUnsavedChanges({
 *   hasChanges,
 *   message: "You have unsaved changes. Are you sure you want to leave?",
 *   onConfirmLeave: () => console.log("User confirmed leaving"),
 * });
 * 
 * // Call setConfirmed(true) to bypass the warning (e.g., after save)
 * const handleSave = async () => {
 *   await save();
 *   setConfirmed(true);
 *   router.push('/success');
 * };
 * 
 * return (
 *   <>
 *     <Form ... />
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export function useUnsavedChanges({
  hasChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onBeforeLeave,
  onConfirmLeave,
  enabled = true,
}: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);
  const [isConfirmed, setConfirmed] = React.useState(false);
  const router = useRouter();

  // Browser beforeunload event
  React.useEffect(() => {
    if (!enabled || !hasChanges || isConfirmed) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers will show their own message, but we set returnValue for compatibility
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, hasChanges, isConfirmed, message]);

  // Reset confirmed state when hasChanges changes to true
  React.useEffect(() => {
    if (hasChanges) {
      setConfirmed(false);
    }
  }, [hasChanges]);

  // Confirm handler
  const handleConfirm = React.useCallback(async () => {
    if (onBeforeLeave) {
      const canLeave = await onBeforeLeave();
      if (!canLeave) {
        setShowDialog(false);
        setPendingNavigation(null);
        return;
      }
    }

    setConfirmed(true);
    onConfirmLeave?.();
    setShowDialog(false);

    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [onBeforeLeave, onConfirmLeave, pendingNavigation, router]);

  // Cancel handler
  const handleCancel = React.useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  // Intercept navigation
  const interceptNavigation = React.useCallback((url: string) => {
    if (!enabled || !hasChanges || isConfirmed) {
      router.push(url);
      return;
    }

    setPendingNavigation(url);
    setShowDialog(true);
  }, [enabled, hasChanges, isConfirmed, router]);

  // Create a safe router.push
  const safePush = React.useCallback((url: string) => {
    interceptNavigation(url);
  }, [interceptNavigation]);

  // Dialog component
  const ConfirmDialog = React.useCallback(() => {
    if (!showDialog) return null;

    return (
      <UnsavedChangesDialog
        open={showDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message={message}
      />
    );
  }, [showDialog, handleConfirm, handleCancel, message]);

  return {
    showDialog,
    setShowDialog,
    isConfirmed,
    setConfirmed,
    interceptNavigation,
    safePush,
    handleConfirm,
    handleCancel,
    ConfirmDialog,
  };
}

// =============================================================================
// UNSAVED CHANGES DIALOG
// =============================================================================

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>{message}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay on page</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Leave anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// =============================================================================
// USE FORM DIRTY STATE
// =============================================================================

export interface UseFormDirtyStateOptions<T> {
  /**
   * Initial form values
   */
  initialValues: T;
  /**
   * Current form values
   */
  currentValues: T;
  /**
   * Custom comparison function
   */
  compare?: (initial: T, current: T) => boolean;
  /**
   * Fields to exclude from comparison
   */
  excludeFields?: (keyof T)[];
}

/**
 * useFormDirtyState - Hook to track if form has been modified.
 * 
 * @example
 * ```tsx
 * const { isDirty, changedFields, reset } = useFormDirtyState({
 *   initialValues: { name: '', email: '' },
 *   currentValues: formData,
 * });
 * 
 * useUnsavedChanges({ hasChanges: isDirty });
 * ```
 */
export function useFormDirtyState<T extends Record<string, unknown>>({
  initialValues,
  currentValues,
  compare,
  excludeFields = [],
}: UseFormDirtyStateOptions<T>) {
  const initialRef = React.useRef(initialValues);

  // Custom comparison or deep equality
  const isDirty = React.useMemo(() => {
    if (compare) {
      return !compare(initialRef.current, currentValues);
    }

    const initial = { ...initialRef.current };
    const current = { ...currentValues };

    // Remove excluded fields
    excludeFields.forEach((field) => {
      delete initial[field];
      delete current[field];
    });

    return JSON.stringify(initial) !== JSON.stringify(current);
  }, [currentValues, compare, excludeFields]);

  // Get list of changed fields
  const changedFields = React.useMemo(() => {
    const changes: (keyof T)[] = [];
    const initial = initialRef.current;

    (Object.keys(currentValues) as (keyof T)[]).forEach((key) => {
      if (excludeFields.includes(key)) return;
      if (JSON.stringify(initial[key]) !== JSON.stringify(currentValues[key])) {
        changes.push(key);
      }
    });

    return changes;
  }, [currentValues, excludeFields]);

  // Reset to initial values
  const reset = React.useCallback((newInitialValues?: T) => {
    if (newInitialValues) {
      initialRef.current = newInitialValues;
    }
  }, []);

  return {
    isDirty,
    changedFields,
    reset,
  };
}

// =============================================================================
// USE NAVIGATION BLOCKER
// =============================================================================

export interface UseNavigationBlockerOptions {
  /**
   * Whether to block navigation
   */
  when: boolean;
  /**
   * Warning message
   */
  message?: string;
}

/**
 * useNavigationBlocker - Simple hook to block navigation with browser warning.
 * 
 * @example
 * ```tsx
 * useNavigationBlocker({
 *   when: isFormDirty,
 *   message: "Changes will be lost!"
 * });
 * ```
 */
export function useNavigationBlocker({
  when,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseNavigationBlockerOptions) {
  React.useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when, message]);
}

export { UnsavedChangesDialog };
