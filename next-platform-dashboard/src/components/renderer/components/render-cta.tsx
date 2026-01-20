import { cn } from "@/lib/utils";

interface RenderCTAProps {
  title?: string;
  // Editor uses "subtitle", legacy uses "description"
  subtitle?: string;
  description?: string;
  // Editor prop names:
  buttonText?: string;
  buttonLink?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  // Legacy prop names:
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function RenderCTA({
  title = "Ready to Get Started?",
  subtitle,
  description,
  // Editor props
  buttonText,
  buttonLink,
  buttonBackgroundColor = "#ffffff",
  buttonTextColor = "#6366f1",
  // Legacy props
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  backgroundColor = "#6366f1",
  textColor = "#ffffff",
  className,
}: RenderCTAProps) {
  // Use editor props if available, fall back to legacy props
  const mainButtonText = buttonText || primaryButtonText;
  const mainButtonHref = buttonLink || primaryButtonHref || "#";
  const descText = subtitle || description;

  return (
    <section
      className={cn(className)}
      style={{ 
        backgroundColor, 
        color: textColor,
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ 
        maxWidth: '800px', 
        marginLeft: 'auto', 
        marginRight: 'auto',
        padding: '0 1rem',
      }}>
        <h2 style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', 
          fontWeight: 700, 
          marginBottom: '1rem' 
        }}>
          {title}
        </h2>
        {descText && (
          <p style={{ 
            fontSize: 'clamp(1rem, 2vw, 1.125rem)', 
            opacity: 0.9, 
            marginBottom: '2rem' 
          }}>
            {descText}
          </p>
        )}

        {(mainButtonText || secondaryButtonText) && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            justifyContent: 'center' 
          }}>
            {mainButtonText && (
              <a
                href={mainButtonHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem 2.5rem',
                  backgroundColor: buttonBackgroundColor,
                  color: buttonTextColor,
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
                  padding: '1rem 2.5rem',
                  border: '1px solid rgba(255,255,255,0.5)',
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
