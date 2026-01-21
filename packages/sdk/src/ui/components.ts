/**
 * @dramac/sdk - UI Components
 * 
 * Re-export platform UI components for use in modules.
 * These are type definitions that reference the actual components
 * from the Dramac platform or can be replaced with local implementations.
 */

// This file provides component type definitions and placeholder exports
// In a real module, these would be resolved at build time to the actual platform components

export interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardContentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardTitleProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  asChild?: boolean;
}

export interface InputProps {
  type?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

export interface LabelProps {
  htmlFor?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface TextareaProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  name?: string;
  id?: string;
}

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  children?: React.ReactNode;
}

export interface AlertProps {
  variant?: 'default' | 'destructive';
  className?: string;
  children?: React.ReactNode;
}

export interface SkeletonProps {
  className?: string;
}

export interface TableProps {
  className?: string;
  children?: React.ReactNode;
}

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Component placeholder functions
// These will be replaced at build time with actual imports

/**
 * NOTE: In your module, import these components from your local UI library
 * or configure the SDK to resolve to your platform's component library.
 * 
 * Example usage in dramac.config.ts:
 * ```typescript
 * export default defineModule({
 *   // ...
 *   ui: {
 *     components: '@/components/ui'
 *   }
 * })
 * ```
 */
