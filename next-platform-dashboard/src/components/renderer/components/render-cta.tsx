import { cn } from "@/lib/utils";

interface RenderCTAProps {
  title: string;
  description: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function RenderCTA({
  title,
  description,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  backgroundColor = "#6366f1",
  textColor = "#ffffff",
  className,
}: RenderCTAProps) {
  return (
    <section
      className={cn(className)}
      style={{ 
        backgroundColor, 
        color: textColor,
        padding: '4rem 1.5rem',
      }}
    >
      <div style={{ 
        maxWidth: '56rem', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        textAlign: 'center' 
      }}>
        <h2 style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', 
          fontWeight: 700, 
          marginBottom: '1rem' 
        }}>
          {title}
        </h2>
        <p style={{ 
          fontSize: '1.25rem', 
          opacity: 0.9, 
          marginBottom: '2rem' 
        }}>
          {description}
        </p>

        {(primaryButtonText || secondaryButtonText) && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            justifyContent: 'center' 
          }}>
            {primaryButtonText && (
              <a
                href={primaryButtonHref || "#"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#1a1a2e',
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
                  border: '1px solid rgba(255,255,255,0.5)',
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
