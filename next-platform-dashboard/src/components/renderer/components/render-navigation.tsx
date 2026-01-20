import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface RenderNavigationProps {
  logo?: string;
  logoText?: string;
  links: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function RenderNavigation({
  logo,
  logoText = "Logo",
  links = [],
  ctaText,
  ctaHref,
  backgroundColor = "#ffffff",
  textColor,
  className,
}: RenderNavigationProps) {
  return (
    <header
      className={cn("border-b", className)}
      style={{ 
        backgroundColor,
        color: textColor || undefined,
      }}
    >
      <nav style={{ 
        maxWidth: '72rem', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ flexShrink: 0 }}>
          {logo ? (
            <img src={logo} alt={logoText} style={{ height: '2rem' }} />
          ) : (
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{logoText}</span>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem',
        }}>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                textDecoration: 'none',
                color: 'inherit',
                opacity: 0.9,
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {ctaText && (
          <a
            href={ctaHref || "#"}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {ctaText}
          </a>
        )}
      </nav>
    </header>
  );
}
