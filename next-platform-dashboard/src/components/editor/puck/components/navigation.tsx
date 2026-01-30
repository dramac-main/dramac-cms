/**
 * Puck Navigation Components
 * 
 * Navigation components for site headers and footers.
 */

import type { NavbarProps, FooterProps, SocialLinksProps } from "@/types/puck";
import { cn } from "@/lib/utils";
import { 
  Menu,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
} from "lucide-react";

// Social icon map
const socialIconMap: Record<string, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Twitter, // Placeholder - TikTok icon not in lucide
  github: Github,
};

// Size utilities
const sizeMap: Record<string, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * Navbar Component
 * Site navigation header.
 */
export function NavbarRender({
  logo,
  logoText = "LOGO",
  links = [],
  sticky = false,
  backgroundColor,
  textColor,
  ctaButton,
}: NavbarProps) {
  return (
    <nav
      className={cn(
        "w-full px-4 md:px-8 py-4",
        sticky && "sticky top-0 z-50"
      )}
      style={{
        backgroundColor: backgroundColor || "hsl(var(--background))",
        color: textColor || undefined,
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8 w-auto" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {(links || []).map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.text}
            </a>
          ))}
          {ctaButton && (
            <a
              href={ctaButton.href}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {ctaButton.text}
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}

/**
 * Footer Component
 * Site footer with links and info.
 */
export function FooterRender({
  logo,
  description,
  columns = [],
  socialLinks = [],
  copyright = "© 2026 Company. All rights reserved.",
  backgroundColor,
  textColor,
}: FooterProps) {
  return (
    <footer
      className="w-full px-4 md:px-8 py-12"
      style={{
        backgroundColor: backgroundColor || "hsl(var(--muted))",
        color: textColor || undefined,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-1">
            {logo ? (
              <img src={logo} alt="Logo" className="h-8 w-auto mb-4" />
            ) : (
              <span className="text-xl font-bold block mb-4">LOGO</span>
            )}
            {description && (
              <p className="text-sm opacity-80">{description}</p>
            )}
          </div>

          {/* Link Columns */}
          {(columns || []).map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {(column.links || []).map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-sm opacity-80">{copyright}</p>
          
          {/* Social Links */}
          {(socialLinks || []).length > 0 && (
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {(socialLinks || []).map((link, index) => {
                const IconComponent = socialIconMap[link.platform] || Facebook;
                return (
                  <a
                    key={index}
                    href={link.url}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                    aria-label={link.platform}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

/**
 * Social Links Component
 * Display social media links with icons.
 */
export function SocialLinksRender({
  links = [],
  size = "md",
  color,
  style = "filled",
}: SocialLinksProps) {
  const styleClasses: Record<string, string> = {
    filled: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-current hover:bg-current/10",
    minimal: "hover:text-primary",
  };

  return (
    <div className="flex items-center gap-3">
      {(links || []).map((link, index) => {
        const IconComponent = socialIconMap[link.platform] || Facebook;
        return (
          <a
            key={index}
            href={link.url}
            className={cn(
              "p-2 rounded-full transition-colors",
              styleClasses[style || "filled"]
            )}
            style={{ color: color || undefined }}
            aria-label={link.platform}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconComponent className={sizeMap[size || "md"]} />
          </a>
        );
      })}
    </div>
  );
}
