"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// =============================================================================
// DESTRUCTIVE CONFIRM DIALOG
// =============================================================================

export interface DestructiveConfirmDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Open change handler
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Confirm handler
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog description
   */
  description?: string;
  /**
   * Text user must type to confirm (e.g., "DELETE")
   */
  confirmText: string;
  /**
   * Placeholder for confirmation input
   */
  confirmPlaceholder?: string;
  /**
   * Confirm button label
   */
  confirmLabel?: string;
  /**
   * Cancel button label
   */
  cancelLabel?: string;
  /**
   * Additional warning text
   */
  warningText?: string;
  /**
   * List of consequences
   */
  consequences?: string[];
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
}

/**
 * DestructiveConfirmDialog - Confirmation dialog with type-to-confirm pattern.
 * 
 * Used for extremely destructive actions where accidental confirmation must be prevented.
 * 
 * @example
 * ```tsx
 * <DestructiveConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Organization"
 *   description="This will permanently delete your organization and all associated data."
 *   confirmText="DELETE"
 *   consequences={[
 *     "All sites will be permanently deleted",
 *     "All team members will lose access",
 *     "All billing history will be removed",
 *   ]}
 *   onConfirm={handleDeleteOrg}
 * />
 * ```
 */
export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  confirmPlaceholder,
  confirmLabel = "I understand, delete permanently",
  cancelLabel = "Cancel",
  warningText = "This action cannot be undone.",
  consequences,
  loading = false,
  icon,
}: DestructiveConfirmDialogProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [internalLoading, setInternalLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isLoading = loading || internalLoading;
  const isValid = inputValue === confirmText;

  // Reset input when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!isValid || isLoading) return;

    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onOpenChange(false);
      } catch {
        // Error handling by parent
      } finally {
        setInternalLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {icon || (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
            )}
            <div className="space-y-1">
              <DialogTitle className="text-destructive">{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{warningText}</p>
            </div>
          </div>

          {/* Consequences list */}
          {consequences && consequences.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="space-y-1.5">
                {consequences.map((consequence, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    {consequence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-input" className="text-sm">
              Type <span className="font-mono font-bold text-destructive">{confirmText}</span> to confirm:
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="confirm-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={confirmPlaceholder || `Type ${confirmText}`}
                className={cn(
                  "pr-10 font-mono",
                  isValid && "border-success focus-visible:ring-success"
                )}
                disabled={isLoading}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {inputValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {isValid ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
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
// BATCH ACTION CONFIRM DIALOG
// =============================================================================

export interface BatchActionConfirmDialogProps<T> {
  /**
   * Dialog open state
   */
  open: boolean;
  /**
   * Open change handler
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Items to act on
   */
  items: T[];
  /**
   * Get item label for display
   */
  getItemLabel?: (item: T) => string;
  /**
   * Action name (e.g., "delete", "archive")
   */
  action: string;
  /**
   * Item type name (e.g., "contact", "site")
   */
  itemType: string;
  /**
   * Confirm handler
   */
  onConfirm: (items: T[]) => void | Promise<void>;
  /**
   * Variant
   */
  variant?: "default" | "destructive";
  /**
   * Maximum items to show in list
   */
  maxItemsToShow?: number;
  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * BatchActionConfirmDialog - Confirmation for actions on multiple items.
 * 
 * @example
 * ```tsx
 * <BatchActionConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   items={selectedContacts}
 *   getItemLabel={(c) => c.name}
 *   action="delete"
 *   itemType="contact"
 *   variant="destructive"
 *   onConfirm={handleBulkDelete}
 * />
 * ```
 */
export function BatchActionConfirmDialog<T>({
  open,
  onOpenChange,
  items,
  getItemLabel,
  action,
  itemType,
  onConfirm,
  variant = "default",
  maxItemsToShow = 5,
  loading = false,
}: BatchActionConfirmDialogProps<T>) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const displayItems = items.slice(0, maxItemsToShow);
  const remainingCount = items.length - maxItemsToShow;

  const handleConfirm = async () => {
    if (isLoading) return;

    const result = onConfirm(items);
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onOpenChange(false);
      } catch {
        // Error handled by parent
      } finally {
        setInternalLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const Icon = variant === "destructive" ? Trash2 : AlertTriangle;
  const iconColor = variant === "destructive" ? "text-destructive" : "text-amber-500";
  const bgColor = variant === "destructive" ? "bg-destructive/10" : "bg-amber-500/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", bgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="space-y-1">
              <DialogTitle>
                {action.charAt(0).toUpperCase() + action.slice(1)} {items.length} {itemType}
                {items.length !== 1 ? "s" : ""}?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {action} the following {itemType}
                {items.length !== 1 ? "s" : ""}?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {displayItems.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-muted"
              >
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                {getItemLabel ? getItemLabel(item) : `Item ${i + 1}`}
              </li>
            ))}
            {remainingCount > 0 && (
              <li className="text-sm text-muted-foreground px-3 py-2">
                ...and {remainingCount} more {itemType}
                {remainingCount !== 1 ? "s" : ""}
              </li>
            )}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action.charAt(0).toUpperCase() + action.slice(1)} {items.length} {itemType}
            {items.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// ACKNOWLEDGMENT DIALOG
// =============================================================================

export interface AcknowledgmentDialogProps {
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
   * Checkbox acknowledgments user must accept
   */
  acknowledgments: string[];
  /**
   * Confirm handler
   */
  onConfirm: () => void | Promise<void>;
  /**
   * Confirm button label
   */
  confirmLabel?: string;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Variant
   */
  variant?: "default" | "warning" | "destructive";
}

/**
 * AcknowledgmentDialog - Confirmation with required checkbox acknowledgments.
 * 
 * @example
 * ```tsx
 * <AcknowledgmentDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Terms of Service"
 *   description="Please acknowledge the following before continuing:"
 *   acknowledgments={[
 *     "I have read and agree to the Terms of Service",
 *     "I understand my data will be processed as described",
 *     "I am at least 18 years old",
 *   ]}
 *   confirmLabel="Continue"
 *   onConfirm={handleAccept}
 * />
 * ```
 */
export function AcknowledgmentDialog({
  open,
  onOpenChange,
  title,
  description,
  acknowledgments,
  onConfirm,
  confirmLabel = "I Acknowledge",
  loading = false,
  variant = "default",
}: AcknowledgmentDialogProps) {
  const [checked, setChecked] = React.useState<boolean[]>([]);
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isLoading = loading || internalLoading;
  const allChecked = checked.length === acknowledgments.length && checked.every(Boolean);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      setChecked(new Array(acknowledgments.length).fill(false));
    }
  }, [open, acknowledgments.length]);

  const handleCheck = (index: number, isChecked: boolean) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = isChecked;
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!allChecked || isLoading) return;

    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onOpenChange(false);
      } catch {
        // Error handled by parent
      } finally {
        setInternalLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const variantConfig = {
    default: {
      icon: AlertTriangle,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    destructive: {
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {acknowledgments.map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <Checkbox
                id={`ack-${i}`}
                checked={checked[i] || false}
                onCheckedChange={(isChecked) => handleCheck(i, isChecked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor={`ack-${i}`}
                className="text-sm leading-relaxed cursor-pointer"
              >
                {text}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!allChecked || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
