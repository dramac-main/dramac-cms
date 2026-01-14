import { cn } from "@/lib/utils";

interface RenderButtonProps {
  text: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  fullWidth?: boolean;
  className?: string;
}

export function RenderButton({
  text,
  variant = "primary",
  size = "md",
  href,
  fullWidth = false,
  className,
}: RenderButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg";

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
    >
      {text}
    </Component>
  );
}
