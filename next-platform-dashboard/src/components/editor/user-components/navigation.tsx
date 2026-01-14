"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

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
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <header
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={cn(
        "px-8 py-4",
        sticky && "sticky top-0 z-50"
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA & Mobile Menu */}
        <div className="flex items-center gap-4">
          {ctaText && (
            <a
              href={ctaHref}
              className="hidden sm:inline-flex px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              {ctaText}
            </a>
          )}
          <button className="md:hidden p-2">
            <Menu className="w-5 h-5" />
          </button>
        </div>
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
    toolbar: () => import("../settings/navigation-settings").then((m) => m.NavigationSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
