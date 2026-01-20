import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderHeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  className?: string;
  children?: ReactNode;
}

export function RenderHero({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = "#f8fafc",
  textColor = "inherit",
  alignment = "center",
  height = "500px",
  overlay = false,
  overlayOpacity = 50,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  className,
}: RenderHeroProps) {
  const alignmentStyles = {
    left: { alignItems: 'flex-start', textAlign: 'left' as const },
    center: { alignItems: 'center', textAlign: 'center' as const },
    right: { alignItems: 'flex-end', textAlign: 'right' as const },
  };

  return (
    <section
      className={cn(className)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5rem 1.5rem',
        minHeight: height,
        backgroundColor: backgroundImage ? undefined : backgroundColor,
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
          fontSize: 'clamp(2rem, 5vw, 3.75rem)', 
          fontWeight: 700, 
          marginBottom: '1rem',
          lineHeight: 1.1,
        }}>
          {title}
        </h1>
        <p style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', 
          opacity: 0.9, 
          marginBottom: '2rem',
          maxWidth: '42rem',
        }}>
          {subtitle}
        </p>

        {(primaryButtonText || secondaryButtonText) && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          }}>
            {primaryButtonText && (
              <a
                href={primaryButtonHref || "#"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a
                href={secondaryButtonHref || "#"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid currentColor',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
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
