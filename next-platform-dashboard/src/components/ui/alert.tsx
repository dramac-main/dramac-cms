import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, CircleX, LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground",
        destructive:
          "border-danger/50 bg-danger/5 text-danger dark:border-danger [&>svg]:text-danger",
        success:
          "border-success/50 bg-success/5 text-success dark:border-success [&>svg]:text-success",
        warning:
          "border-warning/50 bg-warning/5 text-warning dark:border-warning [&>svg]:text-warning",
        info:
          "border-info/50 bg-info/5 text-info dark:border-info [&>svg]:text-info",
        muted:
          "border-muted bg-muted/50 text-muted-foreground [&>svg]:text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** Icon mapping for alert variants */
const alertIconMap: Record<string, LucideIcon> = {
  default: AlertCircle,
  destructive: CircleX,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  muted: AlertCircle,
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// =============================================================================
// ALERT WITH ICON (Convenience Component)
// =============================================================================

export interface AlertWithIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Alert title
   */
  title?: string;
  /**
   * Alert description/message
   */
  description?: string;
  /**
   * Custom icon (overrides default variant icon)
   */
  icon?: LucideIcon;
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;
}

/**
 * AlertWithIcon - A convenience component that includes the appropriate icon.
 * 
 * @example
 * ```tsx
 * <AlertWithIcon
 *   variant="success"
 *   title="Success!"
 *   description="Your changes have been saved."
 * />
 * 
 * <AlertWithIcon
 *   variant="warning"
 *   title="Warning"
 *   description="This action cannot be undone."
 * />
 * ```
 */
const AlertWithIcon = React.forwardRef<HTMLDivElement, AlertWithIconProps>(
  ({ variant = "default", title, description, icon, showIcon = true, className, children, ...props }, ref) => {
    const IconComponent = icon ?? alertIconMap[variant ?? "default"];

    return (
      <Alert ref={ref} variant={variant} className={className} {...props}>
        {showIcon && <IconComponent className="h-4 w-4" />}
        <div>
          {title && <AlertTitle>{title}</AlertTitle>}
          {description && <AlertDescription>{description}</AlertDescription>}
          {children}
        </div>
      </Alert>
    );
  }
);
AlertWithIcon.displayName = "AlertWithIcon";

export { Alert, AlertTitle, AlertDescription, AlertWithIcon, alertVariants, alertIconMap }
