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
  className?: string;
}

export function RenderNavigation({
  logo,
  logoText = "Logo",
  links = [],
  ctaText,
  ctaHref,
  backgroundColor = "#ffffff",
  className,
}: RenderNavigationProps) {
  return (
    <header
      className={cn("px-6 py-4 border-b", className)}
      style={{ backgroundColor }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {ctaText && (
          <a
            href={ctaHref || "#"}
            className="hidden md:inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {ctaText}
          </a>
        )}
      </nav>
    </header>
  );
}
