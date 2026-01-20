import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderHeroProps {
  title?: string;
  subtitle?: string;
  // Editor uses these prop names:
  buttonText?: string;
  buttonLink?: string;
  // Legacy prop names (keep for backwards compatibility):
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  minHeight?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
  children?: ReactNode;
}

export function RenderHero({
  title = "Welcome to Our Website",
  subtitle = "Build amazing experiences with our visual editor",
  // Editor prop names (primary)
  buttonText,
  buttonLink,
  // Legacy prop names (fallback)
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  backgroundImage,
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
  alignment = "center",
  height,
  minHeight = 500,
  overlay = true,
  overlayOpacity = 50,
  className,
}: RenderHeroProps) {
  // Use editor props if available, fall back to legacy props
  const mainButtonText = buttonText || primaryButtonText;
  const mainButtonHref = buttonLink || primaryButtonHref || "#";

  const alignmentStyles = {
    left: { alignItems: 'flex-start', textAlign: 'left' as const },
    center: { alignItems: 'center', textAlign: 'center' as const },
    right: { alignItems: 'flex-end', textAlign: 'right' as const },
  };

  const minHeightValue = height || `${minHeight}px`;

  return (
    <section
      className={cn(className)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5rem 1.5rem',
        minHeight: minHeightValue,
        backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
        ...alignmentStyles[alignment],
      }}
    >
      {overlay && backgroundImage && (
        <div
          style={{ 
            position: 'absolute', 
            inset: 0, 
            backgroundColor: 'black',
            opacity: overlayOpacity / 100 
          }}
        />
      )}

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        maxWidth: '56rem', 
        marginLeft: 'auto', 
        marginRight: 'auto' 
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.75rem, 5vw, 3rem)', 
          fontWeight: 700, 
          marginBottom: '1rem',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <p style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
          opacity: 0.9, 
          marginBottom: '2rem',
          maxWidth: '42rem',
        }}>
          {subtitle}
        </p>

        {(mainButtonText || secondaryButtonText) && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          }}>
            {mainButtonText && (
              <a
                href={mainButtonHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 2rem',
                  backgroundColor: '#ffffff',
                  color: '#1a1a2e',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {mainButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a
                href={secondaryButtonHref || "#"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 2rem',
                  border: '1px solid currentColor',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
