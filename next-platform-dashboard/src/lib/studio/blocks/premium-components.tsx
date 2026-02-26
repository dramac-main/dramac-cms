/**
 * DRAMAC Studio Premium Components - Wix Studio Quality
 * 
 * Completely rewritten components with full functionality:
 * - Navigation: Full-featured header with working mobile menu
 * - Hero: All variants including video background
 * - Footer: Complete footer with all sections
 * - Layout: Flexbox, Grid, Container like Wix Studio
 * 
 * @version 3.0.0
 * @phase STUDIO-PREMIUM
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { getImageUrl, type ImageValue } from "@/lib/studio/utils/image-helpers";

// ============================================================================
// SHARED TYPES & UTILITIES
// ============================================================================

type _ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

// Icon components for consistent rendering
const MenuIcon = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const PlayIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// Utility Icons for smart nav (cart, calendar, user, search, etc.)
const UtilityIcon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    cart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    search: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    heart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  };
  return <>{icons[name] || icons["cart"]}</>;
};

// Social Icons Component
const SocialIcon = ({ platform, className = "w-5 h-5" }: { platform: string; className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
    twitter: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
    instagram: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
    linkedin: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
    youtube: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    github: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />,
    tiktok: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />,
    pinterest: <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />,
  };
  
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      {paths[platform] || null}
    </svg>
  );
};

// ============================================================================
// NAVIGATION - Premium Header Component (Wix Studio Quality)
// ============================================================================

export interface PremiumNavbarProps {
  // Logo Section
  logo?: string | ImageValue;
  logoText?: string;
  logoLink?: string;
  logoHeight?: number;
  logoWidth?: "auto" | number;
  logoPosition?: "left" | "center";
  
  // Navigation Links
  links?: Array<{
    label?: string;
    text?: string; // Legacy support
    href?: string;
    target?: "_self" | "_blank";
    hasDropdown?: boolean;
    dropdownLinks?: Array<{ label?: string; text?: string; href?: string; description?: string }>;
  }>;
  linkAlignment?: "left" | "center" | "right";
  linkSpacing?: "compact" | "normal" | "wide";
  linkFontSize?: "sm" | "md" | "lg";
  linkFontWeight?: "normal" | "medium" | "semibold" | "bold";
  linkTextTransform?: "none" | "uppercase" | "capitalize";
  linkHoverEffect?: "none" | "opacity" | "underline" | "color" | "background";
  linkActiveIndicator?: "none" | "underline" | "dot" | "background";
  
  // Primary CTA Button
  ctaText?: string;
  ctaLink?: string;
  ctaStyle?: "solid" | "outline" | "ghost" | "gradient";
  ctaColor?: string;
  ctaTextColor?: string;
  ctaSize?: "sm" | "md" | "lg";
  ctaBorderRadius?: "none" | "sm" | "md" | "lg" | "full";
  ctaIcon?: "none" | "arrow" | "chevron";
  
  // Secondary CTA
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaStyle?: "solid" | "outline" | "ghost" | "text";
  
  // Layout & Sizing
  layout?: "standard" | "centered" | "split" | "minimal";
  maxWidth?: "full" | "7xl" | "6xl" | "5xl";
  height?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  
  // Appearance
  backgroundColor?: string;
  backgroundOpacity?: number;
  textColor?: string;
  borderBottom?: boolean;
  borderColor?: string;
  borderWidth?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  glassEffect?: boolean;
  glassBlur?: number;
  
  // Positioning & Behavior
  position?: "relative" | "absolute" | "fixed" | "sticky";
  stickyOffset?: number;
  hideOnScroll?: boolean;
  showOnScrollUp?: boolean;
  transparentUntilScroll?: boolean;
  scrollThreshold?: number;
  
  // Mobile Menu Configuration
  mobileBreakpoint?: "sm" | "md" | "lg";
  mobileMenuStyle?: "fullscreen" | "slideRight" | "slideLeft" | "dropdown";
  mobileMenuBackground?: string;
  mobileMenuTextColor?: string;
  mobileMenuAnimation?: "slide" | "fade" | "scale" | "none";
  mobileMenuDuration?: number;
  showMobileMenuOverlay?: boolean;
  mobileMenuOverlayColor?: string;
  mobileMenuOverlayOpacity?: number;
  hamburgerIcon?: "lines" | "dots" | "grid";
  hamburgerSize?: number;
  hamburgerColor?: string;
  showCtaInMobileMenu?: boolean;
  mobileMenuLinkSpacing?: "compact" | "normal" | "spacious";
  
  // Scroll Progress Indicator
  showScrollProgress?: boolean;
  scrollProgressPosition?: "top" | "bottom";
  scrollProgressHeight?: number;
  scrollProgressColor?: string;
  scrollProgressBackground?: string;
  scrollProgressStyle?: "bar" | "line" | "gradient";
  
  // Utility items (cart icon, account, search — injected by modules)
  utilityItems?: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
    badge?: string;
    ariaLabel?: string;
  }>;
  
  // Accessibility
  ariaLabel?: string;
  skipToContent?: string;
  
  // Editor props
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function PremiumNavbarRender({
  // Logo
  logo,
  logoText = "Your Brand",
  logoLink = "/",
  logoHeight = 36,
  logoWidth = "auto",
  logoPosition = "left",
  
  // Links
  links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ],
  linkAlignment = "center",
  linkSpacing = "normal",
  linkFontSize = "md",
  linkFontWeight = "medium",
  linkTextTransform = "none",
  linkHoverEffect = "opacity",
  linkActiveIndicator = "none",
  
  // Primary CTA
  ctaText = "Get Started",
  ctaLink = "#",
  ctaStyle = "solid",
  ctaColor = "",
  ctaTextColor = "#ffffff",
  ctaSize = "md",
  ctaBorderRadius = "md",
  ctaIcon = "none",
  
  // Secondary CTA
  secondaryCtaText,
  secondaryCtaLink = "#",
  secondaryCtaStyle = "ghost",
  
  // Layout
  layout = "standard",
  maxWidth = "7xl",
  height = "md",
  paddingX = "md",
  
  // Appearance
  backgroundColor = "#ffffff",
  backgroundOpacity = 100,
  textColor = "#1f2937",
  borderBottom = true,
  borderColor = "#e5e7eb",
  borderWidth = 1,
  shadow = "sm",
  glassEffect = false,
  glassBlur = 10,
  
  // Positioning & Behavior
  position = "sticky",
  stickyOffset = 0,
  hideOnScroll = false,
  showOnScrollUp = false,
  transparentUntilScroll = false,
  scrollThreshold = 100,
  
  // Mobile Menu
  mobileBreakpoint = "md",
  mobileMenuStyle = "fullscreen",
  mobileMenuBackground = "#ffffff",
  mobileMenuTextColor = "#1f2937",
  mobileMenuAnimation = "fade",
  mobileMenuDuration = 300,
  showMobileMenuOverlay = true,
  mobileMenuOverlayColor = "#000000",
  mobileMenuOverlayOpacity = 50,
  hamburgerIcon = "lines",
  hamburgerSize = 24,
  hamburgerColor,
  showCtaInMobileMenu = true,
  mobileMenuLinkSpacing = "spacious",
  
  // Scroll Progress
  showScrollProgress = false,
  scrollProgressPosition = "top",
  scrollProgressHeight = 3,
  scrollProgressColor = "",
  scrollProgressBackground = "transparent",
  scrollProgressStyle = "bar",
  
  // Utility items
  utilityItems = [],
  
  // Accessibility
  ariaLabel = "Main navigation",
  skipToContent,
  
  // Editor
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
  _liveEffects = false,
}: PremiumNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  
  // Check if effects should run: either not in editor, or live effects enabled
  const enableEffects = !_isEditor || _liveEffects;

  // Handle scroll behavior
  useEffect(() => {
    if (!enableEffects) return; // Disable scroll effects in editor unless live effects enabled

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Check if scrolled past threshold
      setIsScrolled(currentScrollY > scrollThreshold);
      
      // Hide on scroll down, show on scroll up
      if (hideOnScroll || showOnScrollUp) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
      
      // Calculate scroll progress
      if (showScrollProgress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, hideOnScroll, showOnScrollUp, scrollThreshold, enableEffects, showScrollProgress]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Normalized values
  const logoUrl = getImageUrl(logo);
  const effectiveHamburgerColor = hamburgerColor || textColor;
  const isMobileView = _isEditor ? _breakpoint === "mobile" : false;
  
  // Style maps
  const heightClasses: Record<string, string> = {
    sm: "h-14",
    md: "h-16",
    lg: "h-20",
    xl: "h-24",
  };
  
  const paddingClasses: Record<string, string> = {
    sm: "px-4",
    md: "px-6",
    lg: "px-8",
    xl: "px-12",
  };
  
  const maxWidthClasses: Record<string, string> = {
    full: "",
    "7xl": "max-w-7xl",
    "6xl": "max-w-6xl",
    "5xl": "max-w-5xl",
  };
  
  const shadowClasses: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };
  
  const linkSpacingClasses: Record<string, string> = {
    compact: "gap-4",
    normal: "gap-6",
    wide: "gap-10",
  };
  
  const linkFontSizeClasses: Record<string, string> = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  
  const linkWeightClasses: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  
  const ctaSizeClasses: Record<string, string> = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-7 py-3 text-lg",
  };
  
  const ctaRadiusClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  
  const mobileLinkSpacingClasses: Record<string, string> = {
    compact: "py-2",
    normal: "py-3",
    spacious: "py-4",
  };

  // Position class mapping
  // When position is absolute + transparentUntilScroll, switch to fixed after scroll
  const getPositionClass = () => {
    if (position === "absolute" && transparentUntilScroll && isScrolled) {
      return "fixed top-0 left-0 right-0";
    }
    const positionClasses: Record<string, string> = {
      relative: "relative",
      absolute: "absolute top-0 left-0 right-0",
      fixed: "fixed top-0 left-0 right-0",
      sticky: "sticky",
    };
    return positionClasses[position] || positionClasses.relative;
  };

  // Compute background style
  const bgStyle: React.CSSProperties = {
    backgroundColor: transparentUntilScroll && !isScrolled 
      ? "transparent" 
      : `${backgroundColor}${Math.round(backgroundOpacity * 2.55).toString(16).padStart(2, "0")}`,
    backdropFilter: glassEffect ? `blur(${glassBlur}px)` : undefined,
    WebkitBackdropFilter: glassEffect ? `blur(${glassBlur}px)` : undefined,
    borderBottom: borderBottom ? `${borderWidth}px solid ${borderColor}` : undefined,
    top: (position === "sticky" || position === "fixed") ? stickyOffset : undefined,
    transform: !isVisible && (hideOnScroll || showOnScrollUp) ? "translateY(-100%)" : "translateY(0)",
    transition: "transform 0.3s ease, background-color 0.3s ease",
  };

  // Link hover effect classes
  const getLinkHoverClass = () => {
    switch (linkHoverEffect) {
      case "opacity": return "hover:opacity-70 transition-opacity";
      case "underline": return "hover:underline underline-offset-4 transition-all";
      case "color": return "hover:opacity-80 transition-opacity";
      case "background": return "hover:bg-gray-100 px-3 py-1 -mx-3 rounded transition-colors";
      default: return "";
    }
  };

  // Get CTA styles
  const getCtaStyles = (style: string, color: string, textColor: string): React.CSSProperties => {
    switch (style) {
      case "solid":
        return { backgroundColor: color, color: textColor };
      case "outline":
        return { border: `2px solid ${color}`, color: color, backgroundColor: "transparent" };
      case "ghost":
        return { color: color, backgroundColor: "transparent" };
      case "gradient":
        return { 
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          color: textColor,
        };
      default:
        return { backgroundColor: color, color: textColor };
    }
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      {skipToContent && (
        <a 
          href={skipToContent}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded focus:shadow-lg"
        >
          Skip to content
        </a>
      )}
      
      <nav
        ref={navRef}
        id={id}
        className={`w-full z-50 ${getPositionClass()} ${shadowClasses[shadow]} ${className}`}
        style={bgStyle}
        aria-label={ariaLabel}
        role="navigation"
      >
        <div className={`${maxWidthClasses[maxWidth]} mx-auto ${heightClasses[height]} ${paddingClasses[paddingX]} flex items-center`}>
          {/* Logo Area */}
          <div className={`flex items-center shrink-0 ${logoPosition === "center" && layout !== "centered" ? "order-2 flex-1 justify-center" : ""}`}>
            <a href={logoLink} className="flex items-center gap-2 transition-opacity hover:opacity-80">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={logoText} 
                  style={{ 
                    height: logoHeight, 
                    width: logoWidth === "auto" ? "auto" : logoWidth 
                  }} 
                  className="object-contain"
                />
              ) : (
                <span 
                  className="text-xl font-bold tracking-tight"
                  style={{ color: textColor }}
                >
                  {logoText}
                </span>
              )}
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div 
            className={`hidden md:flex items-center ${linkSpacingClasses[linkSpacing]} ${
              layout === "standard" ? "flex-1 ml-10" : 
              layout === "centered" ? "flex-1 justify-center" : 
              layout === "split" ? "flex-1 justify-center" : ""
            } ${linkAlignment === "right" ? "justify-end" : linkAlignment === "center" ? "justify-center" : ""}`}
          >
            {(links || []).map((link, i) => {
              // Support both 'label' and 'text' properties for backwards compatibility
              const linkText = link.label || link.text || '';
              if (!linkText) return null;
              
              return (
                <div key={i} className="relative group">
                  <a
                    href={link.href || "#"}
                    target={link.target || "_self"}
                    className={`inline-flex items-center gap-1 ${linkFontSizeClasses[linkFontSize]} ${linkWeightClasses[linkFontWeight]} ${getLinkHoverClass()}`}
                    style={{ 
                      color: textColor,
                      textTransform: linkTextTransform,
                    }}
                    onMouseEnter={() => link.hasDropdown && setOpenDropdown(i)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {linkText}
                    {link.hasDropdown && <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />}
                  </a>
                
                  {/* Dropdown Menu */}
                  {link.hasDropdown && link.dropdownLinks && openDropdown === i && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 opacity-100 translate-y-0 transition-all z-50"
                      onMouseEnter={() => setOpenDropdown(i)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      {link.dropdownLinks.map((dropLink, j) => (
                        <a
                          key={j}
                          href={dropLink.href || "#"}
                          className="block px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900">{dropLink.label || dropLink.text}</span>
                          {dropLink.description && (
                            <span className="block text-sm text-gray-500 mt-0.5">{dropLink.description}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Utility Items (cart icon, etc.) — injected by modules */}
          {utilityItems && utilityItems.length > 0 && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              {utilityItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="relative p-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: textColor }}
                  aria-label={item.ariaLabel || item.label}
                  title={item.label}
                >
                  <UtilityIcon name={item.icon} className="w-5 h-5" />
                  {item.badge && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full"
                      style={{ backgroundColor: ctaColor, color: ctaTextColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className={`hidden md:flex items-center gap-3 ${logoPosition === "center" ? "order-3" : ""}`}>
            {secondaryCtaText && (
              <a
                href={secondaryCtaLink}
                className={`${ctaSizeClasses[ctaSize]} ${ctaRadiusClasses[ctaBorderRadius]} font-medium transition-all hover:opacity-80`}
                style={getCtaStyles(secondaryCtaStyle, ctaColor, textColor)}
              >
                {secondaryCtaText}
              </a>
            )}
            
            {ctaText && (
              <a
                href={ctaLink}
                className={`inline-flex items-center gap-2 ${ctaSizeClasses[ctaSize]} ${ctaRadiusClasses[ctaBorderRadius]} font-medium transition-all hover:opacity-90 hover:shadow-lg`}
                style={getCtaStyles(ctaStyle, ctaColor, ctaTextColor)}
              >
                {ctaText}
                {ctaIcon === "arrow" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
                {ctaIcon === "chevron" && <ChevronDownIcon className="w-4 h-4 -rotate-90" />}
              </a>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ml-auto ${logoPosition === "center" ? "order-3" : ""}`}
            style={{ ['--hover-bg' as string]: effectiveHamburgerColor ? `${effectiveHamburgerColor}15` : 'rgba(0,0,0,0.05)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = effectiveHamburgerColor ? `${effectiveHamburgerColor}15` : 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <CloseIcon className={`w-${hamburgerSize / 4} h-${hamburgerSize / 4}`} color={effectiveHamburgerColor} />
            ) : (
              <MenuIcon className={`w-${hamburgerSize / 4} h-${hamburgerSize / 4}`} color={effectiveHamburgerColor} />
            )}
          </button>
        </div>
        
        {/* Scroll Progress Indicator */}
        {showScrollProgress && (
          <div 
            className={`absolute left-0 right-0 ${scrollProgressPosition === "top" ? "top-0" : "bottom-0"}`}
            style={{ 
              height: scrollProgressHeight,
              backgroundColor: scrollProgressBackground,
            }}
            role="progressbar"
            aria-valuenow={scrollProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Page scroll progress"
          >
            <div 
              className="h-full transition-all duration-150 ease-out"
              style={{ 
                width: `${scrollProgress}%`,
                background: scrollProgressStyle === "gradient" 
                  ? `linear-gradient(90deg, ${scrollProgressColor}, ${scrollProgressColor}80)` 
                  : scrollProgressColor,
              }}
            />
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && showMobileMenuOverlay && (
        <div
          className="fixed inset-0 z-40 md:hidden transition-opacity"
          style={{ 
            backgroundColor: mobileMenuOverlayColor,
            opacity: mobileMenuOverlayOpacity / 100,
          }}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={`fixed z-50 md:hidden transition-all overflow-y-auto ${
          mobileMenuStyle === "fullscreen" ? "inset-0 pt-16" :
          mobileMenuStyle === "slideRight" ? "top-0 right-0 bottom-0 w-80 max-w-[85vw]" :
          mobileMenuStyle === "slideLeft" ? "top-0 left-0 bottom-0 w-80 max-w-[85vw]" :
          "top-16 left-0 right-0"
        } ${
          mobileMenuOpen 
            ? mobileMenuAnimation === "fade" ? "opacity-100 visible" :
              mobileMenuAnimation === "slide" ? "translate-x-0 opacity-100" :
              mobileMenuAnimation === "scale" ? "scale-100 opacity-100" : "opacity-100"
            : mobileMenuAnimation === "fade" ? "opacity-0 invisible" :
              mobileMenuAnimation === "slide" && mobileMenuStyle === "slideRight" ? "translate-x-full opacity-0" :
              mobileMenuAnimation === "slide" && mobileMenuStyle === "slideLeft" ? "-translate-x-full opacity-0" :
              mobileMenuAnimation === "scale" ? "scale-95 opacity-0" : "opacity-0 invisible"
        }`}
        style={{ 
          backgroundColor: mobileMenuBackground,
          transitionDuration: `${mobileMenuDuration}ms`,
        }}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Close button for slideRight/slideLeft */}
        {(mobileMenuStyle === "slideRight" || mobileMenuStyle === "slideLeft") && (
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor }}>
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} style={{ height: logoHeight * 0.8 }} className="object-contain" />
            ) : (
              <span className="text-lg font-bold" style={{ color: mobileMenuTextColor }}>{logoText}</span>
            )}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = mobileMenuTextColor ? `${mobileMenuTextColor}15` : 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Close menu"
            >
              <CloseIcon color={mobileMenuTextColor} />
            </button>
          </div>
        )}

        {/* Mobile Links */}
        <div className={`p-6 space-y-1 ${mobileMenuStyle === "fullscreen" ? "flex flex-col items-center justify-center min-h-[60vh]" : ""}`}>
          {/* Close button for fullscreen menu */}
          {mobileMenuStyle === "fullscreen" && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-3 rounded-full transition-colors z-50"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = mobileMenuTextColor ? `${mobileMenuTextColor}15` : 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Close menu"
            >
              <CloseIcon className="w-8 h-8" color={mobileMenuTextColor} />
            </button>
          )}
          
          {(links || []).map((link, i) => {
            // Support both 'label' and 'text' properties for backwards compatibility
            const linkText = link.label || link.text || '';
            if (!linkText) return null;
            
            return (
              <div key={i}>
                <a
                  href={link.href || "#"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block ${mobileLinkSpacingClasses[mobileMenuLinkSpacing]} ${mobileMenuStyle === "fullscreen" ? "text-2xl text-center" : "text-lg"} font-medium transition-colors hover:opacity-70`}
                  style={{ color: mobileMenuTextColor }}
                >
                  {linkText}
                </a>
                
                {/* Mobile Dropdown */}
                {link.hasDropdown && link.dropdownLinks && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                    {link.dropdownLinks.map((dropLink, j) => (
                      <a
                        key={j}
                        href={dropLink.href || "#"}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-base transition-colors hover:opacity-70"
                        style={{ color: mobileMenuTextColor, opacity: 0.8 }}
                      >
                        {dropLink.label || dropLink.text}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile Utility Items */}
          {utilityItems && utilityItems.length > 0 && (
            <div className={`pt-4 mt-4 border-t flex items-center justify-center gap-6 ${mobileMenuStyle === "fullscreen" ? "w-full max-w-xs mx-auto" : ""}`} style={{ borderColor }}>
              {utilityItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative flex items-center gap-2 p-2 rounded-lg transition-colors"
                  style={{ color: mobileMenuTextColor }}
                  aria-label={item.ariaLabel || item.label}
                >
                  <UtilityIcon name={item.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span
                      className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full"
                      style={{ backgroundColor: ctaColor, color: ctaTextColor }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Mobile CTAs */}
          {showCtaInMobileMenu && (ctaText || secondaryCtaText) && (
            <div className={`pt-6 mt-6 border-t space-y-3 ${mobileMenuStyle === "fullscreen" ? "w-full max-w-xs" : ""}`} style={{ borderColor }}>
              {secondaryCtaText && (
                <a
                  href={secondaryCtaLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-center py-3 px-6 ${ctaRadiusClasses[ctaBorderRadius]} font-medium transition-all hover:opacity-80`}
                  style={getCtaStyles(secondaryCtaStyle, ctaColor, mobileMenuTextColor)}
                >
                  {secondaryCtaText}
                </a>
              )}
              
              {ctaText && (
                <a
                  href={ctaLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-center py-3 px-6 ${ctaRadiusClasses[ctaBorderRadius]} font-medium transition-all hover:opacity-90`}
                  style={getCtaStyles(ctaStyle, ctaColor, ctaTextColor)}
                >
                  {ctaText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// HERO - Premium Hero Component (Wix Studio Quality)
// ============================================================================

export interface PremiumHeroProps {
  // Content
  title?: string;
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  titleWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  titleAlign?: "left" | "center" | "right";
  
  subtitle?: string;
  subtitleSize?: "sm" | "md" | "lg";
  subtitleColor?: string;
  
  description?: string;
  descriptionSize?: "sm" | "md" | "lg";
  descriptionColor?: string;
  descriptionMaxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  
  // Badge/Tag
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeStyle?: "solid" | "outline" | "pill";
  
  // Primary CTA
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  primaryButtonStyle?: "solid" | "outline" | "gradient";
  primaryButtonSize?: "sm" | "md" | "lg" | "xl";
  primaryButtonRadius?: "none" | "sm" | "md" | "lg" | "full";
  primaryButtonIcon?: "none" | "arrow" | "chevron" | "play";
  
  // Secondary CTA
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  secondaryButtonStyle?: "solid" | "outline" | "ghost" | "text";
  secondaryButtonColor?: string;
  
  // Layout
  variant?: "centered" | "split" | "splitReverse" | "fullscreen" | "video" | "minimal" | "cards";
  contentAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundAttachment?: "scroll" | "fixed";
  backgroundOverlay?: boolean;
  backgroundOverlayColor?: string;
  backgroundOverlayOpacity?: number;
  backgroundGradient?: string;
  
  // Video Background
  videoSrc?: string;
  videoPoster?: string | ImageValue;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  showVideoControls?: boolean;
  showPlayButton?: boolean;
  playButtonSize?: "sm" | "md" | "lg";
  playButtonColor?: string;
  
  // Hero Image (for split layouts)
  image?: string | ImageValue;
  imageAlt?: string;
  imagePosition?: "left" | "right";
  imageFit?: "cover" | "contain" | "fill";
  imageRounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  imageShadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  imageAnimation?: "none" | "fadeIn" | "slideUp" | "slideIn" | "zoom";
  
  // Sizing
  minHeight?: "auto" | "50vh" | "75vh" | "100vh" | "100dvh" | "fullscreen" | "screen";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
  paddingTop?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingBottom?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "sm" | "md" | "lg" | "xl";
  
  // Scroll Indicator
  showScrollIndicator?: boolean;
  scrollIndicatorIcon?: "arrow" | "chevron" | "chevronDouble" | "mouse" | "hand" | "dots" | "line";
  scrollIndicatorColor?: string;
  scrollIndicatorSize?: "sm" | "md" | "lg" | "xl";
  scrollIndicatorAnimation?: "bounce" | "pulse" | "fade" | "slide" | "none";
  scrollIndicatorLabel?: string;
  scrollTarget?: string;
  
  // Mouse/Touch Parallax Effect
  enableMouseParallax?: boolean;
  mouseParallaxIntensity?: number; // 1-100
  mouseParallaxLayers?: number; // Number of parallax layers
  mouseParallaxSmooth?: number; // Smoothing factor (ms)
  // Advanced 3D Parallax
  enable3DParallax?: boolean;
  parallax3DRotateX?: number; // Max X rotation in degrees
  parallax3DRotateY?: number; // Max Y rotation in degrees
  parallax3DScale?: number; // Scale factor on hover (1.0 = no scale)
  parallax3DPerspective?: number; // Perspective distance in px
  parallaxAffectBackground?: boolean; // Move background image
  parallaxAffectContent?: boolean; // Move content elements
  
  // Decorations
  showPattern?: boolean;
  patternType?: "dots" | "grid" | "waves" | "circles";
  patternOpacity?: number;
  
  // Animation
  animateOnLoad?: boolean;
  animationType?: "fadeIn" | "slideUp" | "slideIn" | "zoom";
  animationDelay?: number;
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function PremiumHeroRender({
  // Content
  title = "Build Something Amazing",
  titleSize = "xl",
  titleColor,
  titleWeight = "bold",
  titleAlign = "center",
  
  subtitle,
  subtitleSize = "lg",
  subtitleColor,
  
  description = "Create beautiful, responsive websites with our powerful drag-and-drop builder. No coding required.",
  descriptionSize = "md",
  descriptionColor,
  descriptionMaxWidth = "lg",
  
  // Badge
  badge,
  badgeColor = "",
  badgeTextColor = "#ffffff",
  badgeStyle = "pill",
  
  // Primary CTA
  primaryButtonText = "Get Started Free",
  primaryButtonLink = "#",
  primaryButtonColor = "",
  primaryButtonTextColor = "#ffffff",
  primaryButtonStyle = "solid",
  primaryButtonSize = "lg",
  primaryButtonRadius = "lg",
  primaryButtonIcon = "arrow",
  
  // Secondary CTA
  secondaryButtonText = "Learn More",
  secondaryButtonLink = "#",
  secondaryButtonStyle = "outline",
  secondaryButtonColor,
  
  // Layout
  variant = "centered",
  contentAlign = "center",
  verticalAlign = "center",
  
  // Background
  backgroundColor = "#ffffff",
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  backgroundAttachment = "scroll",
  backgroundOverlay = false,
  backgroundOverlayColor = "#000000",
  backgroundOverlayOpacity = 50,
  backgroundGradient,
  
  // Video
  videoSrc,
  videoPoster,
  videoAutoplay = true,
  videoLoop = true,
  videoMuted = true,
  showVideoControls = false,
  showPlayButton = false,
  playButtonSize = "lg",
  playButtonColor = "#ffffff",
  
  // Image
  image,
  imageAlt = "Hero image",
  imagePosition = "right",
  imageFit = "cover",
  imageRounded = "lg",
  imageShadow = "xl",
  imageAnimation = "fadeIn",
  
  // Sizing
  minHeight = "75vh",
  maxWidth = "7xl",
  paddingTop = "xl",
  paddingBottom = "xl",
  paddingX = "md",
  
  // Scroll Indicator
  showScrollIndicator = false,
  scrollIndicatorIcon = "arrow",
  scrollIndicatorColor = "#6b7280",
  scrollIndicatorSize = "md",
  scrollIndicatorAnimation = "bounce",
  scrollIndicatorLabel = "Scroll down",
  scrollTarget = "#main",
  
  // Mouse/Touch Parallax
  enableMouseParallax = false,
  mouseParallaxIntensity = 20,
  mouseParallaxLayers = 1,
  mouseParallaxSmooth = 150,
  // Advanced 3D Parallax
  enable3DParallax = false,
  parallax3DRotateX = 10,
  parallax3DRotateY = 10,
  parallax3DScale = 1.02,
  parallax3DPerspective = 1000,
  parallaxAffectBackground = true,
  parallaxAffectContent = true,
  
  // Pattern
  showPattern = false,
  patternType = "dots",
  patternOpacity = 10,
  
  // Animation
  animateOnLoad = true,
  animationType = "fadeIn",
  animationDelay = 0,
  
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
  _liveEffects = false,
}: PremiumHeroProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(videoAutoplay);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  
  // Check if effects should run
  const enableEffects = !_isEditor || _liveEffects;

  // Normalize images
  const bgImageUrl = getImageUrl(backgroundImage);
  const heroImageUrl = getImageUrl(image);
  const posterUrl = getImageUrl(videoPoster);
  
  // Style maps
  const titleSizeClasses: Record<string, string> = {
    sm: "text-2xl sm:text-3xl md:text-4xl",
    md: "text-3xl sm:text-4xl md:text-5xl",
    lg: "text-4xl sm:text-5xl md:text-6xl",
    xl: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
    "2xl": "text-5xl sm:text-6xl md:text-7xl lg:text-8xl",
  };
  
  const titleWeightClasses: Record<string, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  };
  
  const subtitleSizeClasses: Record<string, string> = {
    sm: "text-lg md:text-xl",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
  };
  
  const descSizeClasses: Record<string, string> = {
    sm: "text-base md:text-lg",
    md: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
  };
  
  const descMaxWidthClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    full: "max-w-none",
  };
  
  const buttonSizeClasses: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
    xl: "px-10 py-4 text-xl",
  };
  
  const buttonRadiusClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };
  
  const heightClasses: Record<string, string> = {
    auto: "",
    "50vh": "min-h-[50vh]",
    "75vh": "min-h-[75vh]",
    "100vh": "min-h-screen",
    "100dvh": "min-h-[100dvh]", // Dynamic viewport height - accounts for mobile address bar
    fullscreen: "min-h-[100svh]", // Small viewport height - safe for nav overlay
    screen: "min-h-screen",
  };
  
  // Scroll indicator size classes
  const scrollIndicatorSizeClasses: Record<string, string> = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };
  
  // Scroll indicator animation classes
  const scrollIndicatorAnimationClasses: Record<string, string> = {
    bounce: "animate-bounce",
    pulse: "animate-pulse",
    fade: "animate-[fade_2s_ease-in-out_infinite]",
    slide: "animate-[slideDown_1.5s_ease-in-out_infinite]",
    none: "",
  };
  
  // Scroll indicator icons
  const renderScrollIndicatorIcon = () => {
    const sizeClass = scrollIndicatorSizeClasses[scrollIndicatorSize];
    const baseProps = { className: sizeClass, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
    
    switch (scrollIndicatorIcon) {
      case "chevron":
        return (
          <svg {...baseProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      case "chevronDouble":
        return (
          <svg {...baseProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 5l-7 7-7-7M19 13l-7 7-7-7" />
          </svg>
        );
      case "mouse":
        return (
          <svg {...baseProps}>
            <rect x="6" y="3" width="12" height="18" rx="6" strokeWidth={2} />
            <line x1="12" y1="7" x2="12" y2="11" strokeWidth={2} strokeLinecap="round" />
          </svg>
        );
      case "hand":
        return (
          <svg {...baseProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        );
      case "dots":
        return (
          <svg {...baseProps}>
            <circle cx="12" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        );
      case "line":
        return (
          <svg {...baseProps}>
            <line x1="12" y1="2" x2="12" y2="22" strokeWidth={2} strokeLinecap="round" />
          </svg>
        );
      case "arrow":
      default:
        return (
          <svg {...baseProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
    }
  };
  
  // Mouse parallax effect handler
  useEffect(() => {
    if (!enableEffects || (!enableMouseParallax && !enable3DParallax)) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    };
    
    // Reset on mouse leave for smooth return
    const handleMouseLeave = () => {
      setMousePosition({ x: 0.5, y: 0.5 });
    };
    
    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener("mousemove", handleMouseMove);
      heroElement.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        heroElement.removeEventListener("mousemove", handleMouseMove);
        heroElement.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [enableEffects, enableMouseParallax, enable3DParallax]);
  
  // Calculate parallax transform for layers (2D translate)
  const getParallaxTransform = (layer: number) => {
    if (!enableMouseParallax) return {};
    const intensity = (mouseParallaxIntensity / 100) * (layer + 1) * 10;
    const x = (mousePosition.x - 0.5) * intensity;
    const y = (mousePosition.y - 0.5) * intensity;
    return {
      transform: `translate(${x}px, ${y}px)`,
      transition: `transform ${mouseParallaxSmooth}ms ease-out`,
    };
  };
  
  // Calculate 3D parallax transform (perspective + rotation)
  const get3DParallaxTransform = (target: "background" | "content") => {
    if (!enable3DParallax) return {};
    if (target === "background" && !parallaxAffectBackground) return {};
    if (target === "content" && !parallaxAffectContent) return {};
    
    const rotateY = (mousePosition.x - 0.5) * parallax3DRotateY;
    const rotateX = -(mousePosition.y - 0.5) * parallax3DRotateX;
    const scale = 1 + (parallax3DScale - 1) * 0.5; // Subtle scale on hover
    
    // Content moves opposite to mouse for depth effect
    const depthMultiplier = target === "background" ? 0.5 : 1;
    
    return {
      transform: `
        perspective(${parallax3DPerspective}px)
        rotateX(${rotateX * depthMultiplier}deg)
        rotateY(${rotateY * depthMultiplier}deg)
        scale(${scale})
      `.replace(/\s+/g, ' ').trim(),
      transition: `transform ${mouseParallaxSmooth}ms ease-out`,
      transformStyle: "preserve-3d" as const,
    };
  };
  
  // Combined parallax style for hero wrapper
  const heroParallaxStyle: React.CSSProperties = enable3DParallax ? {
    transformStyle: "preserve-3d",
    perspective: parallax3DPerspective,
  } : {};
  
  const paddingTopClasses: Record<string, string> = {
    none: "pt-0",
    sm: "pt-8 md:pt-12",
    md: "pt-12 md:pt-16",
    lg: "pt-16 md:pt-24",
    xl: "pt-20 md:pt-32",
    "2xl": "pt-24 md:pt-40",
  };
  
  const paddingBottomClasses: Record<string, string> = {
    none: "pb-0",
    sm: "pb-8 md:pb-12",
    md: "pb-12 md:pb-16",
    lg: "pb-16 md:pb-24",
    xl: "pb-20 md:pb-32",
    "2xl": "pb-24 md:pb-40",
  };
  
  const paddingXClasses: Record<string, string> = {
    sm: "px-4",
    md: "px-6",
    lg: "px-8",
    xl: "px-12",
  };
  
  const maxWidthClasses: Record<string, string> = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    "7xl": "max-w-7xl",
    full: "max-w-none",
  };
  
  const imageRoundedClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  };
  
  const imageShadowClasses: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };
  
  const verticalAlignClasses: Record<string, string> = {
    top: "justify-start",
    center: "justify-center",
    bottom: "justify-end",
  };
  
  const contentAlignClasses: Record<string, string> = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  // Get button styles
  const getButtonStyles = (style: string, bgColor: string, textColor: string): React.CSSProperties => {
    switch (style) {
      case "solid":
        return { backgroundColor: bgColor, color: textColor };
      case "outline":
        return { border: `2px solid ${bgColor || titleColor || "#1f2937"}`, color: bgColor || titleColor || "#1f2937", backgroundColor: "transparent" };
      case "ghost":
        return { color: bgColor || titleColor || "#1f2937", backgroundColor: "transparent" };
      case "gradient":
        return { 
          background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
          color: textColor,
        };
      case "text":
        return { color: bgColor || titleColor || "#1f2937", backgroundColor: "transparent" };
      default:
        return { backgroundColor: bgColor, color: textColor };
    }
  };

  // Background style
  const bgStyle: React.CSSProperties = {
    backgroundColor: !bgImageUrl && !videoSrc && !backgroundGradient ? backgroundColor : undefined,
    backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : backgroundGradient || undefined,
    backgroundPosition,
    backgroundSize,
    backgroundAttachment,
  };

  // Handle video play/pause
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Render split/splitReverse variant
  if (variant === "split" || variant === "splitReverse") {
    const isReversed = variant === "splitReverse" || imagePosition === "left";
    
    return (
      <section
        ref={heroRef}
        id={id}
        className={`relative w-full ${heightClasses[minHeight]} ${paddingTopClasses[paddingTop]} ${paddingBottomClasses[paddingBottom]} ${paddingXClasses[paddingX]} flex items-center ${className}`}
        style={bgStyle}
      >
        {/* Overlay */}
        {backgroundOverlay && bgImageUrl && (
          <div 
            className="absolute inset-0 z-0" 
            style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} 
            aria-hidden="true" 
          />
        )}
        
        <div 
          className={`relative z-10 ${maxWidthClasses[maxWidth]} mx-auto w-full`}
          style={enableMouseParallax ? getParallaxTransform(0) : undefined}
        >
          <div className={`grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center ${isReversed ? "" : ""}`}>
            {/* Content */}
            <div className={`flex flex-col ${contentAlignClasses[contentAlign]} ${isReversed ? "md:order-2" : "md:order-1"}`}>
              {badge && (
                <span 
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium mb-6 ${
                    badgeStyle === "pill" ? "rounded-full" : badgeStyle === "outline" ? "rounded border-2" : "rounded"
                  }`}
                  style={{ 
                    backgroundColor: badgeStyle !== "outline" ? badgeColor : "transparent",
                    borderColor: badgeStyle === "outline" ? badgeColor : undefined,
                    color: badgeStyle === "outline" ? badgeColor : badgeTextColor,
                  }}
                >
                  {badge}
                </span>
              )}
              
              <h1 
                className={`${titleSizeClasses[titleSize]} ${titleWeightClasses[titleWeight]} leading-tight mb-4 md:mb-6`}
                style={{ color: titleColor }}
              >
                {title}
              </h1>
              
              {subtitle && (
                <p 
                  className={`${subtitleSizeClasses[subtitleSize]} font-medium mb-2 md:mb-4`}
                  style={{ color: subtitleColor || (titleColor ? `${titleColor}dd` : undefined) }}
                >
                  {subtitle}
                </p>
              )}
              
              {description && (
                <p 
                  className={`${descSizeClasses[descriptionSize]} ${descMaxWidthClasses[descriptionMaxWidth]} mb-6 md:mb-8 opacity-80 leading-relaxed`}
                  style={{ color: descriptionColor || titleColor }}
                >
                  {description}
                </p>
              )}
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {primaryButtonText && (
                  <a
                    href={primaryButtonLink}
                    className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5`}
                    style={getButtonStyles(primaryButtonStyle, primaryButtonColor, primaryButtonTextColor)}
                  >
                    {primaryButtonText}
                    {primaryButtonIcon === "arrow" && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                    {primaryButtonIcon === "chevron" && <ChevronDownIcon className="w-5 h-5 -rotate-90" />}
                    {primaryButtonIcon === "play" && <PlayIcon className="w-5 h-5" />}
                  </a>
                )}
                
                {secondaryButtonText && (
                  <a
                    href={secondaryButtonLink}
                    className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-80`}
                    style={getButtonStyles(secondaryButtonStyle, secondaryButtonColor || primaryButtonColor, titleColor || "#1f2937")}
                  >
                    {secondaryButtonText}
                  </a>
                )}
              </div>
            </div>
            
            {/* Image */}
            <div className={`${isReversed ? "md:order-1" : "md:order-2"}`}>
              {heroImageUrl && (
                <div className={`relative ${imageAnimation !== "none" && enableEffects ? "animate-fadeIn" : ""}`}>
                  <img
                    src={heroImageUrl}
                    alt={imageAlt}
                    className={`w-full h-auto object-${imageFit} ${imageRoundedClasses[imageRounded]} ${imageShadowClasses[imageShadow]}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Video Background Variant
  if (variant === "video" && videoSrc) {
    return (
      <section
        ref={heroRef}
        id={id}
        className={`relative w-full ${heightClasses[minHeight]} flex flex-col ${verticalAlignClasses[verticalAlign]} overflow-hidden ${className}`}
      >
        {/* Video Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={videoSrc}
          poster={posterUrl}
          autoPlay={videoAutoplay}
          loop={videoLoop}
          muted={videoMuted}
          playsInline
          controls={showVideoControls}
        />
        
        {/* Overlay */}
        <div 
          className="absolute inset-0 z-10" 
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} 
          aria-hidden="true" 
        />
        
        {/* Content */}
        <div 
          className={`relative z-20 ${maxWidthClasses[maxWidth]} mx-auto w-full ${paddingXClasses[paddingX]} ${paddingTopClasses[paddingTop]} ${paddingBottomClasses[paddingBottom]}`}
          style={enableMouseParallax ? getParallaxTransform(0) : undefined}
        >
          <div className={`flex flex-col ${contentAlignClasses[contentAlign]}`}>
            {badge && (
              <span 
                className={`inline-flex items-center px-3 py-1 text-sm font-medium mb-6 rounded-full`}
                style={{ backgroundColor: badgeColor, color: badgeTextColor }}
              >
                {badge}
              </span>
            )}
            
            <h1 
              className={`${titleSizeClasses[titleSize]} ${titleWeightClasses[titleWeight]} leading-tight mb-4 md:mb-6`}
              style={{ color: titleColor || "#ffffff" }}
            >
              {title}
            </h1>
            
            {description && (
              <p 
                className={`${descSizeClasses[descriptionSize]} ${descMaxWidthClasses[descriptionMaxWidth]} mb-6 md:mb-8 opacity-90 leading-relaxed`}
                style={{ color: descriptionColor || "#ffffff" }}
              >
                {description}
              </p>
            )}
            
            {/* Play Button */}
            {showPlayButton && (
              <button
                onClick={toggleVideo}
                className={`mb-8 ${
                  playButtonSize === "sm" ? "w-12 h-12" : playButtonSize === "lg" ? "w-20 h-20" : "w-16 h-16"
                } rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/30 hover:scale-105`}
                style={{ color: playButtonColor }}
                aria-label={isVideoPlaying ? "Pause video" : "Play video"}
              >
                {isVideoPlaying ? (
                  <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <PlayIcon className="w-1/2 h-1/2 ml-1" />
                )}
              </button>
            )}
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {primaryButtonText && (
                <a
                  href={primaryButtonLink}
                  className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-90 hover:shadow-lg`}
                  style={getButtonStyles(primaryButtonStyle, primaryButtonColor, primaryButtonTextColor)}
                >
                  {primaryButtonText}
                </a>
              )}
              
              {secondaryButtonText && (
                <a
                  href={secondaryButtonLink}
                  className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-80`}
                  style={getButtonStyles(secondaryButtonStyle, secondaryButtonColor || "#ffffff", "#ffffff")}
                >
                  {secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <a 
            href={scrollTarget}
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 ${scrollIndicatorAnimationClasses[scrollIndicatorAnimation]}`}
            style={{ color: scrollIndicatorColor }}
            aria-label={scrollIndicatorLabel}
          >
            {scrollIndicatorLabel && (
              <span className="text-xs uppercase tracking-widest opacity-70">{scrollIndicatorLabel}</span>
            )}
            {renderScrollIndicatorIcon()}
          </a>
        )}
      </section>
    );
  }

  // Default Centered/Fullscreen/Minimal Variant
  return (
    <section
      ref={heroRef}
      id={id}
      className={`relative w-full ${heightClasses[minHeight]} ${paddingTopClasses[paddingTop]} ${paddingBottomClasses[paddingBottom]} ${paddingXClasses[paddingX]} flex flex-col ${verticalAlignClasses[verticalAlign]} ${className}`}
      style={{ ...bgStyle, ...heroParallaxStyle }}
    >
      {/* Background with 3D parallax */}
      {enable3DParallax && parallaxAffectBackground && bgImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${bgImageUrl})`,
            backgroundPosition,
            backgroundSize,
            ...get3DParallaxTransform("background"),
          }} 
          aria-hidden="true" 
        />
      )}
      
      {/* Overlay */}
      {backgroundOverlay && bgImageUrl && (
        <div 
          className="absolute inset-0 z-0" 
          style={{ backgroundColor: backgroundOverlayColor, opacity: backgroundOverlayOpacity / 100 }} 
          aria-hidden="true" 
        />
      )}
      
      {/* Pattern */}
      {showPattern && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            opacity: patternOpacity / 100,
            backgroundImage: patternType === "dots" 
              ? `radial-gradient(circle, ${titleColor || "#000"} 1px, transparent 1px)`
              : patternType === "grid"
              ? `linear-gradient(${titleColor || "#000"}22 1px, transparent 1px), linear-gradient(90deg, ${titleColor || "#000"}22 1px, transparent 1px)`
              : undefined,
            backgroundSize: patternType === "dots" ? "20px 20px" : "40px 40px",
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Content */}
      <div 
        className={`relative z-10 ${maxWidthClasses[maxWidth]} mx-auto w-full`}
        style={{
          ...(enableMouseParallax ? getParallaxTransform(0) : {}),
          ...(enable3DParallax ? get3DParallaxTransform("content") : {}),
        }}
      >
        <div className={`flex flex-col ${contentAlignClasses[contentAlign]}`}>
          {badge && (
            <span 
              className={`inline-flex items-center px-3 py-1 text-sm font-medium mb-6 ${
                badgeStyle === "pill" ? "rounded-full" : badgeStyle === "outline" ? "rounded border-2" : "rounded"
              } ${contentAlign === "center" ? "self-center" : contentAlign === "right" ? "self-end" : "self-start"}`}
              style={{ 
                backgroundColor: badgeStyle !== "outline" ? badgeColor : "transparent",
                borderColor: badgeStyle === "outline" ? badgeColor : undefined,
                color: badgeStyle === "outline" ? badgeColor : badgeTextColor,
              }}
            >
              {badge}
            </span>
          )}
          
          <h1 
            className={`${titleSizeClasses[titleSize]} ${titleWeightClasses[titleWeight]} leading-tight mb-4 md:mb-6`}
            style={{ color: titleColor }}
          >
            {title}
          </h1>
          
          {subtitle && (
            <p 
              className={`${subtitleSizeClasses[subtitleSize]} font-medium mb-2 md:mb-4`}
              style={{ color: subtitleColor || (titleColor ? `${titleColor}dd` : undefined) }}
            >
              {subtitle}
            </p>
          )}
          
          {description && (
            <p 
              className={`${descSizeClasses[descriptionSize]} ${descMaxWidthClasses[descriptionMaxWidth]} mb-6 md:mb-8 opacity-80 leading-relaxed`}
              style={{ color: descriptionColor || titleColor }}
            >
              {description}
            </p>
          )}
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {primaryButtonText && (
              <a
                href={primaryButtonLink}
                className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5`}
                style={getButtonStyles(primaryButtonStyle, primaryButtonColor, primaryButtonTextColor)}
              >
                {primaryButtonText}
                {primaryButtonIcon === "arrow" && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
                {primaryButtonIcon === "chevron" && <ChevronDownIcon className="w-5 h-5 -rotate-90" />}
                {primaryButtonIcon === "play" && <PlayIcon className="w-5 h-5" />}
              </a>
            )}
            
            {secondaryButtonText && (
              <a
                href={secondaryButtonLink}
                className={`inline-flex items-center justify-center gap-2 ${buttonSizeClasses[primaryButtonSize]} ${buttonRadiusClasses[primaryButtonRadius]} font-semibold transition-all hover:opacity-80`}
                style={getButtonStyles(secondaryButtonStyle, secondaryButtonColor || primaryButtonColor, titleColor || "#1f2937")}
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <a 
          href={scrollTarget}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 ${scrollIndicatorAnimationClasses[scrollIndicatorAnimation]}`}
          style={{ color: scrollIndicatorColor }}
          aria-label={scrollIndicatorLabel}
        >
          {scrollIndicatorLabel && (
            <span className="text-xs uppercase tracking-widest opacity-70">{scrollIndicatorLabel}</span>
          )}
          {renderScrollIndicatorIcon()}
        </a>
      )}
    </section>
  );
}

// ============================================================================
// FOOTER - Premium Footer Component (Wix Studio Quality)
// ============================================================================

export interface PremiumFooterProps {
  // Logo & Branding
  logo?: string | ImageValue;
  logoText?: string;
  logoLink?: string;
  logoHeight?: number;
  tagline?: string;
  
  // Company Description
  description?: string;
  descriptionMaxWidth?: "xs" | "sm" | "md";
  
  // Link Columns
  columns?: Array<{
    title?: string;
    links?: Array<{ label?: string; href?: string; isNew?: boolean; isExternal?: boolean }>;
  }>;
  columnCount?: 2 | 3 | 4 | 5;
  
  // Social Links
  socialLinks?: Array<{
    platform?: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "github" | "tiktok" | "pinterest";
    url?: string;
    label?: string;
  }>;
  socialPosition?: "logo" | "bottom" | "both";
  socialSize?: "sm" | "md" | "lg";
  socialStyle?: "icons" | "outline" | "filled";
  socialColor?: string;
  
  // Newsletter
  showNewsletter?: boolean;
  newsletterTitle?: string;
  newsletterDescription?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  newsletterButtonColor?: string;
  newsletterPosition?: "column" | "bottom" | "separate";
  
  // Contact Info
  showContactInfo?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  
  // Bottom Bar
  copyright?: string;
  copyrightAlign?: "left" | "center" | "right";
  bottomLinks?: Array<{ label?: string; href?: string }>;
  showBottomDivider?: boolean;
  
  // App Store Badges
  showAppBadges?: boolean;
  appStoreLink?: string;
  playStoreLink?: string;
  
  // Layout & Style
  variant?: "standard" | "centered" | "minimal" | "mega";
  layout?: "stacked" | "inline";
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  dividerColor?: string;
  
  // Spacing
  paddingTop?: "sm" | "md" | "lg" | "xl";
  paddingBottom?: "sm" | "md" | "lg" | "xl";
  paddingX?: "sm" | "md" | "lg";
  maxWidth?: "5xl" | "6xl" | "7xl" | "full";
  columnGap?: "sm" | "md" | "lg";
  
  // Border
  borderTop?: boolean;
  borderColor?: string;
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function PremiumFooterRender({
  // Logo
  logo,
  logoText = "Your Brand",
  logoLink = "/",
  logoHeight = 32,
  tagline,
  
  // Description
  description = "Building the future of web design with powerful, intuitive tools.",
  descriptionMaxWidth = "sm",
  
  // Columns
  columns = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Templates", href: "#" },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#", isNew: true },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "Help Center", href: "#" },
        { label: "Community", href: "#" },
        { label: "API Reference", href: "#", isExternal: true },
      ],
    },
  ],
  columnCount = 3,
  
  // Social
  socialLinks = [
    { platform: "twitter", url: "#", label: "Twitter" },
    { platform: "linkedin", url: "#", label: "LinkedIn" },
    { platform: "github", url: "#", label: "GitHub" },
    { platform: "instagram", url: "#", label: "Instagram" },
  ],
  socialPosition = "logo",
  socialSize = "md",
  socialStyle = "icons",
  socialColor,
  
  // Newsletter
  showNewsletter = true,
  newsletterTitle = "Subscribe to our newsletter",
  newsletterDescription = "Get the latest updates and news directly in your inbox.",
  newsletterPlaceholder = "Enter your email",
  newsletterButtonText = "Subscribe",
  newsletterButtonColor = "",
  newsletterPosition = "column",
  
  // Contact
  showContactInfo = false,
  email = "hello@company.com",
  phone = "+260 97X XXX XXX",
  address = "123 Main Street, City, Country",
  
  // Bottom
  copyright = `© ${new Date().getFullYear()} Company. All rights reserved.`,
  copyrightAlign = "left",
  bottomLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookies", href: "#" },
  ],
  showBottomDivider = true,
  
  // App Badges
  showAppBadges = false,
  appStoreLink = "#",
  playStoreLink = "#",
  
  // Layout
  variant = "standard",
  layout = "stacked",
  backgroundColor = "#0f172a",
  textColor = "#e2e8f0",
  accentColor = "",
  linkColor = "#94a3b8",
  linkHoverColor = "#ffffff",
  dividerColor = "#334155",
  
  // Spacing
  paddingTop = "xl",
  paddingBottom = "lg",
  paddingX = "md",
  maxWidth = "7xl",
  columnGap = "lg",
  
  // Border
  borderTop = false,
  borderColor = "#334155",
  
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: PremiumFooterProps) {
  const logoUrl = getImageUrl(logo);
  
  // Style maps
  const paddingTopClasses: Record<string, string> = {
    sm: "pt-8",
    md: "pt-12",
    lg: "pt-16",
    xl: "pt-20",
  };
  
  const paddingBottomClasses: Record<string, string> = {
    sm: "pb-6",
    md: "pb-8",
    lg: "pb-12",
    xl: "pb-16",
  };
  
  const paddingXClasses: Record<string, string> = {
    sm: "px-4",
    md: "px-6",
    lg: "px-8",
  };
  
  const maxWidthClasses: Record<string, string> = {
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-none",
  };
  
  const columnGapClasses: Record<string, string> = {
    sm: "gap-6",
    md: "gap-8",
    lg: "gap-12",
  };
  
  const descMaxWidthClasses: Record<string, string> = {
    xs: "max-w-[200px]",
    sm: "max-w-[280px]",
    md: "max-w-[360px]",
  };
  
  const socialSizeClasses: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Grid columns based on layout
  const getGridCols = () => {
    const baseColCount = Math.min(columns.length, columnCount);
    if (variant === "minimal") return "md:grid-cols-2";
    if (newsletterPosition === "column") return `md:grid-cols-${baseColCount + 2} lg:grid-cols-${baseColCount + 2}`;
    return `md:grid-cols-${baseColCount + 1} lg:grid-cols-${baseColCount + 1}`;
  };

  const renderSocialLinks = () => (
    <div className="flex items-center gap-4">
      {socialLinks.map((social, i) => (
        <a
          key={i}
          href={social.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`transition-all hover:opacity-80 hover:-translate-y-0.5 ${
            socialStyle === "outline" ? "p-2 border rounded-full" : 
            socialStyle === "filled" ? "p-2 rounded-full" : ""
          }`}
          style={{ 
            color: socialColor || linkColor,
            borderColor: socialStyle === "outline" ? (socialColor || linkColor) : undefined,
            backgroundColor: socialStyle === "filled" ? `${socialColor || linkColor}20` : undefined,
          }}
          aria-label={social.label || social.platform}
        >
          <SocialIcon platform={social.platform || ""} className={socialSizeClasses[socialSize]} />
        </a>
      ))}
    </div>
  );

  const renderNewsletter = (isCompact = false) => (
    <div className={isCompact ? "" : "max-w-md"}>
      <h3 className="font-semibold text-base mb-2" style={{ color: textColor }}>{newsletterTitle}</h3>
      {!isCompact && newsletterDescription && (
        <p className="text-sm mb-4" style={{ color: linkColor }}>{newsletterDescription}</p>
      )}
      <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder={newsletterPlaceholder}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm"
          style={{ color: textColor }}
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg font-medium text-white text-sm transition-all hover:opacity-90 hover:shadow-lg shrink-0"
          style={{ backgroundColor: newsletterButtonColor }}
        >
          {newsletterButtonText}
        </button>
      </form>
    </div>
  );

  return (
    <footer
      id={id}
      className={`w-full ${paddingTopClasses[paddingTop]} ${paddingBottomClasses[paddingBottom]} ${paddingXClasses[paddingX]} ${className}`}
      style={{ 
        backgroundColor,
        borderTop: borderTop ? `1px solid ${borderColor}` : undefined,
      }}
    >
      <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
        {/* Main Footer Content */}
        <div className={`grid grid-cols-1 ${columnGapClasses[columnGap]} mb-12`} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
          {/* Logo & Description Column */}
          <div className="col-span-1 md:col-span-2">
            <a href={logoLink} className="inline-block mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={logoText} style={{ height: logoHeight }} className="object-contain" />
              ) : (
                <span className="text-xl font-bold" style={{ color: textColor }}>{logoText}</span>
              )}
            </a>
            
            {tagline && (
              <p className="text-sm font-medium mb-2" style={{ color: textColor }}>{tagline}</p>
            )}
            
            {description && (
              <p className={`text-sm mb-6 ${descMaxWidthClasses[descriptionMaxWidth]}`} style={{ color: linkColor }}>
                {description}
              </p>
            )}
            
            {/* Contact Info */}
            {showContactInfo && (
              <div className="space-y-2 mb-6">
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: linkColor }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {email}
                  </a>
                )}
                {phone && (
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: linkColor }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {phone}
                  </a>
                )}
                {address && (
                  <p className="flex items-start gap-2 text-sm" style={{ color: linkColor }}>
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {address}
                  </p>
                )}
              </div>
            )}
            
            {/* Social Links (if position is 'logo') */}
            {(socialPosition === "logo" || socialPosition === "both") && socialLinks.length > 0 && renderSocialLinks()}
          </div>
          
          {/* Link Columns */}
          {columns.map((column, i) => (
            <div key={i}>
              <h3 
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: textColor }}
              >
                {column.title}
              </h3>
              <ul className="space-y-3">
                {(column.links || []).map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href || "#"}
                      target={link.isExternal ? "_blank" : "_self"}
                      rel={link.isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 text-sm transition-colors"
                      style={{ color: linkColor }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = linkHoverColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
                    >
                      {link.label}
                      {link.isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: accentColor, color: "#ffffff" }}>
                          NEW
                        </span>
                      )}
                      {link.isExternal && (
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter (if position is 'column') */}
          {showNewsletter && newsletterPosition === "column" && (
            <div className="md:col-span-2">
              {renderNewsletter()}
            </div>
          )}
        </div>
        
        {/* Newsletter (if position is 'bottom') */}
        {showNewsletter && newsletterPosition === "bottom" && (
          <div className="pb-8 mb-8" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            {renderNewsletter()}
          </div>
        )}
        
        {/* App Badges */}
        {showAppBadges && (
          <div className="flex flex-wrap gap-4 mb-8">
            <a href={appStoreLink} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
              <img 
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                alt="Download on the App Store" 
                className="h-10"
              />
            </a>
            <a href={playStoreLink} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-10"
              />
            </a>
          </div>
        )}
        
        {/* Bottom Bar */}
        <div 
          className={`pt-8 flex flex-col md:flex-row items-center ${
            copyrightAlign === "center" ? "justify-center" : copyrightAlign === "right" ? "justify-end" : "justify-between"
          } gap-4`}
          style={{ borderTop: showBottomDivider ? `1px solid ${dividerColor}` : undefined }}
        >
          <p className="text-sm" style={{ color: linkColor }}>{copyright}</p>
          
          {/* Bottom Links + Social */}
          <div className="flex flex-wrap items-center gap-6">
            {bottomLinks.length > 0 && (
              <div className="flex flex-wrap gap-4 md:gap-6">
                {bottomLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.href || "#"}
                    className="text-sm transition-colors"
                    style={{ color: linkColor }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = linkHoverColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            
            {/* Social Links (if position is 'bottom' or 'both') */}
            {(socialPosition === "bottom" || socialPosition === "both") && socialLinks.length > 0 && renderSocialLinks()}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// FLEXBOX LAYOUT - Wix Studio Style Container
// ============================================================================

export interface FlexboxProps {
  children?: React.ReactNode;
  
  // Display
  display?: "flex" | "inline-flex";
  direction?: "row" | "row-reverse" | "column" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  
  // Alignment
  justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly";
  alignItems?: "start" | "end" | "center" | "baseline" | "stretch";
  alignContent?: "start" | "end" | "center" | "between" | "around" | "stretch";
  
  // Gap
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rowGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  columnGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  // Sizing
  width?: "auto" | "full" | "screen" | "fit" | "min" | "max" | string;
  minWidth?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full" | "none" | string;
  height?: "auto" | "full" | "screen" | "fit" | "min" | "max" | string;
  minHeight?: string;
  
  // Padding
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingY?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  
  // Margin
  margin?: "auto" | "none" | "xs" | "sm" | "md" | "lg" | "xl";
  marginX?: "auto" | "none" | "xs" | "sm" | "md" | "lg" | "xl";
  marginY?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundOverlay?: string;
  backgroundOverlayOpacity?: number;
  
  // Border
  border?: boolean;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "solid" | "dashed" | "dotted";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  
  // Shadow
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  // Effects
  opacity?: number;
  blur?: number;
  
  // Overflow
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflowY?: "visible" | "hidden" | "scroll" | "auto";
  
  // Position
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  zIndex?: number;
  
  // Responsive
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  
  // Accessibility
  role?: string;
  ariaLabel?: string;
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function FlexboxRender({
  children,
  
  // Display
  display = "flex",
  direction = "row",
  wrap = "wrap",
  
  // Alignment
  justifyContent = "start",
  alignItems = "stretch",
  alignContent = "start",
  
  // Gap
  gap = "md",
  rowGap,
  columnGap,
  
  // Sizing
  width = "full",
  minWidth,
  maxWidth = "none",
  height = "auto",
  minHeight,
  
  // Padding
  padding = "md",
  paddingX,
  paddingY,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  
  // Margin
  margin = "none",
  marginX = "auto",
  marginY,
  
  // Background
  backgroundColor = "transparent",
  backgroundImage,
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundOverlay,
  backgroundOverlayOpacity = 50,
  
  // Border
  border = false,
  borderWidth = 1,
  borderColor = "#e5e7eb",
  borderStyle = "solid",
  borderRadius = "none",
  
  // Shadow
  shadow = "none",
  
  // Effects
  opacity = 100,
  blur,
  
  // Overflow
  overflow = "visible",
  overflowX,
  overflowY,
  
  // Position
  position = "relative",
  zIndex,
  
  // Responsive
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  
  // Accessibility
  role,
  ariaLabel,
  
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: FlexboxProps) {
  const bgImageUrl = getImageUrl(backgroundImage);
  
  // Class maps
  const directionClasses: Record<string, string> = {
    row: "flex-row",
    "row-reverse": "flex-row-reverse",
    column: "flex-col",
    "column-reverse": "flex-col-reverse",
  };
  
  const wrapClasses: Record<string, string> = {
    nowrap: "flex-nowrap",
    wrap: "flex-wrap",
    "wrap-reverse": "flex-wrap-reverse",
  };
  
  const justifyClasses: Record<string, string> = {
    start: "justify-start",
    end: "justify-end",
    center: "justify-center",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  
  const alignItemsClasses: Record<string, string> = {
    start: "items-start",
    end: "items-end",
    center: "items-center",
    baseline: "items-baseline",
    stretch: "items-stretch",
  };
  
  const gapClasses: Record<string, string> = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    "2xl": "gap-12",
  };
  
  const paddingClasses: Record<string, string> = {
    none: "p-0",
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
    "2xl": "p-12",
  };
  
  const paddingXClasses: Record<string, string> = {
    none: "px-0",
    xs: "px-1",
    sm: "px-2",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
    "2xl": "px-12",
  };
  
  const paddingYClasses: Record<string, string> = {
    none: "py-0",
    xs: "py-1",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
    xl: "py-8",
    "2xl": "py-12",
  };
  
  const maxWidthClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    none: "max-w-none",
  };
  
  const radiusClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };
  
  const shadowClasses: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };
  
  const widthClasses: Record<string, string> = {
    auto: "w-auto",
    full: "w-full",
    screen: "w-screen",
    fit: "w-fit",
    min: "w-min",
    max: "w-max",
  };
  
  const heightClasses: Record<string, string> = {
    auto: "h-auto",
    full: "h-full",
    screen: "h-screen",
    fit: "h-fit",
    min: "h-min",
    max: "h-max",
  };

  // Build visibility classes
  const visibility = [
    hideOnMobile ? "hidden sm:flex" : "",
    hideOnTablet ? "sm:hidden md:flex" : "",
    hideOnDesktop ? "md:hidden" : "",
  ].filter(Boolean).join(" ");

  // Build style object
  const style: React.CSSProperties = {
    backgroundColor: bgImageUrl ? undefined : backgroundColor,
    backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
    backgroundSize,
    backgroundPosition,
    opacity: opacity / 100,
    filter: blur ? `blur(${blur}px)` : undefined,
    borderWidth: border ? borderWidth : undefined,
    borderColor: border ? borderColor : undefined,
    borderStyle: border ? borderStyle : undefined,
    zIndex,
    minWidth,
    minHeight,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  };

  // Determine if width/height are custom values
  const widthClass = widthClasses[width as keyof typeof widthClasses] || "";
  const heightClass = heightClasses[height as keyof typeof heightClasses] || "";
  const maxWClass = maxWidthClasses[maxWidth as keyof typeof maxWidthClasses] || "";

  return (
    <div
      id={id}
      className={`
        ${display}
        ${directionClasses[direction]}
        ${wrapClasses[wrap]}
        ${justifyClasses[justifyContent]}
        ${alignItemsClasses[alignItems]}
        ${gapClasses[gap]}
        ${paddingX ? paddingXClasses[paddingX] : paddingClasses[padding]}
        ${paddingY ? paddingYClasses[paddingY] : ""}
        ${widthClass}
        ${heightClass}
        ${maxWClass}
        ${marginX === "auto" ? "mx-auto" : ""}
        ${radiusClasses[borderRadius]}
        ${shadowClasses[shadow]}
        ${position !== "static" ? position : ""}
        ${visibility}
        ${className}
      `.replace(/\s+/g, " ").trim()}
      style={style}
      role={role}
      aria-label={ariaLabel}
    >
      {/* Background Overlay */}
      {backgroundOverlay && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ backgroundColor: backgroundOverlay, opacity: backgroundOverlayOpacity / 100 }}
          aria-hidden="true"
        />
      )}
      
      {/* Children with relative z-index */}
      <div className={`relative z-10 ${display} ${directionClasses[direction]} ${wrapClasses[wrap]} ${justifyClasses[justifyContent]} ${alignItemsClasses[alignItems]} ${gapClasses[gap]} w-full h-full`}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// GRID LAYOUT - CSS Grid Container
// ============================================================================

export interface GridProps {
  children?: React.ReactNode;
  
  // Grid Template
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | "auto-fit" | "auto-fill";
  rows?: 1 | 2 | 3 | 4 | 5 | 6 | "auto";
  columnsTablet?: 1 | 2 | 3 | 4 | 6;
  columnsMobile?: 1 | 2 | 3;
  
  // Gap
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rowGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  columnGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  // Alignment
  justifyItems?: "start" | "end" | "center" | "stretch";
  alignItems?: "start" | "end" | "center" | "stretch";
  justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly";
  
  // Sizing
  minColumnWidth?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full" | "none";
  
  // Padding
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  paddingY?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  
  // Background
  backgroundColor?: string;
  
  // Border
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function GridRender({
  children,
  
  // Grid Template
  columns = 3,
  rows = "auto",
  columnsTablet = 2,
  columnsMobile = 1,
  
  // Gap
  gap = "md",
  rowGap,
  columnGap,
  
  // Alignment
  justifyItems = "stretch",
  alignItems = "stretch",
  justifyContent = "start",
  
  // Sizing
  minColumnWidth = "250px",
  maxWidth = "7xl",
  
  // Padding
  padding = "md",
  paddingX,
  paddingY,
  
  // Background
  backgroundColor = "transparent",
  
  // Border
  borderRadius = "none",
  
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: GridProps) {
  const gapClasses: Record<string, string> = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    "2xl": "gap-12",
  };
  
  const paddingClasses: Record<string, string> = {
    none: "p-0",
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
    "2xl": "p-12",
  };
  
  const maxWidthClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    none: "max-w-none",
  };
  
  const radiusClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  // Build grid columns class
  const getGridCols = () => {
    if (columns === "auto-fit" || columns === "auto-fill") {
      return ""; // Will use inline style
    }
    return `grid-cols-${columnsMobile} md:grid-cols-${columnsTablet} lg:grid-cols-${columns}`;
  };

  const gridStyle: React.CSSProperties = {
    backgroundColor,
    gridTemplateColumns: (columns === "auto-fit" || columns === "auto-fill") 
      ? `repeat(${columns}, minmax(${minColumnWidth}, 1fr))` 
      : undefined,
  };

  return (
    <div
      id={id}
      className={`
        grid
        ${getGridCols()}
        ${gapClasses[gap]}
        ${paddingClasses[padding]}
        ${maxWidthClasses[maxWidth]}
        ${radiusClasses[borderRadius]}
        mx-auto
        ${className}
      `.replace(/\s+/g, " ").trim()}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CONTAINER - Wix Studio Style Container
// ============================================================================

export interface ContainerProps {
  children?: React.ReactNode;
  
  // Layout
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full" | "none";
  center?: boolean;
  
  // Padding
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingY?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  // Background
  backgroundColor?: string;
  backgroundImage?: string | ImageValue;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundOverlay?: string;
  backgroundOverlayOpacity?: number;
  
  // Border
  border?: boolean;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  
  // Shadow
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  
  // Min Height
  minHeight?: string;
  
  // Responsive
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
  _liveEffects?: boolean;
}

export function ContainerRender({
  children,
  
  // Layout
  maxWidth = "7xl",
  center = true,
  
  // Padding
  padding = "md",
  paddingX,
  paddingY,
  
  // Background
  backgroundColor = "transparent",
  backgroundImage,
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundOverlay,
  backgroundOverlayOpacity = 50,
  
  // Border
  border = false,
  borderWidth = 1,
  borderColor = "#e5e7eb",
  borderRadius = "none",
  
  // Shadow
  shadow = "none",
  
  // Min Height
  minHeight,
  
  // Responsive
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  
  id,
  className = "",
  _breakpoint = "desktop",
  _isEditor = false,
}: ContainerProps) {
  const bgImageUrl = getImageUrl(backgroundImage);
  
  const maxWidthClasses: Record<string, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    none: "",
  };
  
  const paddingClasses: Record<string, string> = {
    none: "p-0",
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
    "2xl": "p-12",
  };
  
  const paddingXClasses: Record<string, string> = {
    none: "px-0",
    xs: "px-1",
    sm: "px-2",
    md: "px-4",
    lg: "px-6",
    xl: "px-8",
    "2xl": "px-12",
  };
  
  const paddingYClasses: Record<string, string> = {
    none: "py-0",
    xs: "py-1",
    sm: "py-2",
    md: "py-4",
    lg: "py-6",
    xl: "py-8",
    "2xl": "py-12",
  };
  
  const radiusClasses: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  };
  
  const shadowClasses: Record<string, string> = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };

  // Build visibility classes
  const visibility = [
    hideOnMobile ? "hidden sm:block" : "",
    hideOnTablet ? "sm:hidden md:block" : "",
    hideOnDesktop ? "md:hidden" : "",
  ].filter(Boolean).join(" ");

  const style: React.CSSProperties = {
    backgroundColor: bgImageUrl ? undefined : backgroundColor,
    backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
    backgroundSize,
    backgroundPosition,
    borderWidth: border ? borderWidth : undefined,
    borderColor: border ? borderColor : undefined,
    borderStyle: border ? "solid" : undefined,
    minHeight,
  };

  return (
    <div
      id={id}
      className={`
        relative
        w-full
        ${maxWidthClasses[maxWidth]}
        ${center ? "mx-auto" : ""}
        ${paddingX ? paddingXClasses[paddingX] : paddingClasses[padding]}
        ${paddingY ? paddingYClasses[paddingY] : ""}
        ${radiusClasses[borderRadius]}
        ${shadowClasses[shadow]}
        ${visibility}
        ${className}
      `.replace(/\s+/g, " ").trim()}
      style={style}
    >
      {/* Background Overlay */}
      {backgroundOverlay && (
        <div 
          className={`absolute inset-0 z-0 pointer-events-none ${radiusClasses[borderRadius]}`}
          style={{ backgroundColor: backgroundOverlay, opacity: backgroundOverlayOpacity / 100 }}
          aria-hidden="true"
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PremiumNavbarRender as NavbarRender,
  PremiumHeroRender as HeroRender,
  PremiumFooterRender as FooterRender,
};
