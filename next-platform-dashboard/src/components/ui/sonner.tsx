"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Toaster as Sonner, ToasterProps as SonnerToasterProps } from "sonner";

type ToasterProps = SonnerToasterProps;

/**
 * Toaster component - renders toast notifications
 * 
 * Uses Sonner for toast management with theme-aware styling.
 * Mounted in Providers component to be available throughout the app.
 * 
 * @example
 * ```tsx
 * // In your providers
 * <Toaster position="bottom-right" richColors />
 * 
 * // To show toasts, use the showToast utility:
 * import { showToast } from '@/lib/toast';
 * showToast.success('Saved successfully');
 * ```
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-danger/10 group-[.toaster]:text-danger group-[.toaster]:border-danger/30",
          success: "group-[.toaster]:bg-success/10 group-[.toaster]:text-success group-[.toaster]:border-success/30",
          warning: "group-[.toaster]:bg-warning/10 group-[.toaster]:text-warning group-[.toaster]:border-warning/30",
          info: "group-[.toaster]:bg-info/10 group-[.toaster]:text-info group-[.toaster]:border-info/30",
          loading: "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground group-[.toaster]:border-border",
          closeButton: "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
        },
      }}
      closeButton
      expand={false}
      {...props}
    />
  );
};

export { Toaster };
export type { ToasterProps };
