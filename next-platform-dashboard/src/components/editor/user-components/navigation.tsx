"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NavigationSettings } from "../settings/navigation-settings";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationProps {
  logo?: string;
  logoText?: string;
  links?: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
}

const defaultLinks: NavLink[] = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navigation({
  logo = "",
  logoText = "DRAMAC",
  links = defaultLinks,
  ctaText = "Get Started",
  ctaHref = "#",
  backgroundColor = "#ffffff",
  textColor = "",
  sticky = false,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const {
    connectors: { connect, drag },
  } = useNode();

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setIsMobile(width < 768);
      }
    };

    checkWidth();
    
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
          containerRef.current = ref;
        }
      }}
      className={cn(
        sticky && "sticky top-0 z-50"
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <nav style={{ maxWidth: '72rem', marginLeft: 'auto', marginRight: 'auto', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            {logo ? (
              <img src={logo} alt={logoText} style={{ height: '2rem' }} />
            ) : (
              <span style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 700 }}>{logoText}</span>
            )}
          </div>

          {/* Desktop Links */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => e.preventDefault()}
                  style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', color: 'inherit', opacity: 0.9 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Desktop CTA & Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isMobile && ctaText && (
              <a
                href={ctaHref}
                onClick={(e) => e.preventDefault()}
                style={{
                  display: 'inline-flex',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                {ctaText}
              </a>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  display: 'flex',
                  padding: '0.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
              >
                {mobileMenuOpen ? <X style={{ width: '1.5rem', height: '1.5rem' }} /> : <Menu style={{ width: '1.5rem', height: '1.5rem' }} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 0',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              marginTop: '1rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '0.5rem 0',
                  }}
                >
                  {link.label}
                </a>
              ))}
              {ctaText && (
                <a
                  href={ctaHref}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  {ctaText}
                </a>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

Navigation.craft = {
  displayName: "Navigation",
  props: {
    logo: "",
    logoText: "DRAMAC",
    links: defaultLinks,
    ctaText: "Get Started",
    ctaHref: "#",
    backgroundColor: "#ffffff",
    textColor: "",
    sticky: false,
  },
  related: {
    settings: NavigationSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
