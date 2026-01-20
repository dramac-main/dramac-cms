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
}: RenderButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '0.5rem',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#6366f1', color: '#ffffff' },
    secondary: { backgroundColor: '#64748b', color: '#ffffff' },
    outline: { backgroundColor: 'transparent', border: '1px solid currentColor', color: 'inherit' },
    ghost: { backgroundColor: 'transparent', color: 'inherit' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
    md: { height: '2.5rem', padding: '0 1rem', fontSize: '1rem' },
    lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1.125rem' },
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {text}
    </Component>
  );
}
