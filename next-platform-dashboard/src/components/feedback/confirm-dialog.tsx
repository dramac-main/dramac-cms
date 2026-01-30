"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// =============================================================================
// CONFIRM DIALOG
// =============================================================================

export type ConfirmDialogVariant = "default" | "destructive" | "warning";

export interface ConfirmDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Open change handler
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description
   */
  description?: string;
  /**
   * Confirm button label
   */
  confirmLabel?: string;
  /**
   * Cancel button label
   */
  cancelLabel?: string;
  /**
   * Confirm handler
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Cancel handler
   */
  onCancel?: () => void;
  /**
   * Dialog variant
   */
  variant?: ConfirmDialogVariant;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
  /**
   * Children for custom content
   */
  children?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: Info,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    buttonVariant: "default" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    buttonVariant: "default" as const,
  },
  destructive: {
    icon: Trash2,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    buttonVariant: "destructive" as const,
  },
};

/**
 * ConfirmDialog - Reusable confirmation dialog.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete item?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  icon,
  children,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onOpenChange(false);
      } catch {
        // Error handling should be done by the parent
      } finally {
        setInternalLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-4">
          <div className="flex items-start gap-4">
            {icon || (
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                config.iconBg
              )}>
                <Icon className={cn("h-5 w-5", config.iconColor)} />
              </div>
            )}
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DELETE DIALOG
// =============================================================================

export interface DeleteDialogProps extends Omit<ConfirmDialogProps, "variant" | "title" | "confirmLabel"> {
  /**
   * Item name to delete
   */
  itemName?: string;
  /**
   * Item type (e.g., "contact", "site", "module")
   */
  itemType?: string;
}

/**
 * DeleteDialog - Pre-configured destructive confirmation.
 * 
 * @example
 * ```tsx
 * <DeleteDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   itemName="John Doe"
 *   itemType="contact"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
function DeleteDialog({
  itemName,
  itemType = "item",
  description,
  ...props
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      variant="destructive"
      title={`Delete ${itemType}?`}
      description={
        description ||
        `Are you sure you want to delete ${itemName ? `"${itemName}"` : `this ${itemType}`}? This action cannot be undone.`
      }
      confirmLabel="Delete"
    />
  );
}

// =============================================================================
// ALERT DIALOG (Non-modal)
// =============================================================================

export type AlertBannerVariant = "info" | "success" | "warning" | "error";

export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Banner variant
   */
  variant?: AlertBannerVariant;
  /**
   * Banner title
   */
  title?: string;
  /**
   * Banner message
   */
  message: string;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Dismissible
   */
  dismissible?: boolean;
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
  /**
   * Auto dismiss timeout (ms)
   */
  autoDismiss?: number;
}

const alertVariantConfig = {
  info: {
    icon: Info,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-500",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
    iconColor: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-800 dark:text-amber-200",
    iconColor: "text-amber-500",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-800 dark:text-red-200",
    iconColor: "text-red-500",
  },
};

/**
 * AlertBanner - Non-modal alert banner.
 * 
 * @example
 * ```tsx
 * <AlertBanner
 *   variant="warning"
 *   title="Storage limit approaching"
 *   message="You have used 90% of your storage quota."
 *   action={{ label: "Upgrade", onClick: () => {} }}
 *   dismissible
 * />
 * ```
 */
const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({
    className,
    variant = "info",
    title,
    message,
    action,
    dismissible,
    onDismiss,
    autoDismiss,
    ...props
  }, ref) => {
    const [visible, setVisible] = React.useState(true);
    const config = alertVariantConfig[variant];
    const Icon = config.icon;

    React.useEffect(() => {
      if (autoDismiss && autoDismiss > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoDismiss);
        return () => clearTimeout(timer);
      }
    }, [autoDismiss, onDismiss]);

    const handleDismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4",
              config.bg,
              config.border,
              className
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
            
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={cn("font-medium text-sm", config.text)}>{title}</h4>
              )}
              <p className={cn("text-sm", config.text, title && "mt-1")}>{message}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {action && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )}
              {dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleDismiss}
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AlertBanner.displayName = "AlertBanner";

export { ConfirmDialog, DeleteDialog, AlertBanner };
