/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * Component Responsive Configurations
 *
 * Pre-defined responsive configurations for all 53 component types.
 * Each config specifies how the component adapts across breakpoints.
 */

import type {
  ComponentResponsiveConfig,
  BreakpointConfig,
  Breakpoint,
} from "./types";
import { defaultBreakpointConfig } from "./breakpoints";

// =============================================================================
// COMPONENT RESPONSIVE CONFIGS
// =============================================================================

/**
 * Responsive configurations for all components
 */
export const componentResponsiveConfigs: Record<
  string,
  ComponentResponsiveConfig
> = {
  // -------------------------------------------------------------------------
  // NAVIGATION COMPONENTS
  // -------------------------------------------------------------------------
  Navbar: {
    componentType: "Navbar",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false, // Navbar uses hamburger menu instead
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "0.5rem", tablet: "1rem", desktop: "1.5rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.2, tablet: 1.3, desktop: 1.4, large: 1.4 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["nav-links", "cta-button"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["hamburger-menu"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "hamburger",
    touchOptimized: true,
    priority: "critical",
  },

  // -------------------------------------------------------------------------
  // HERO COMPONENTS
  // -------------------------------------------------------------------------
  Hero: {
    componentType: "Hero",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "2rem", tablet: "2.5rem", desktop: "3rem", large: "4rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.65, tablet: 0.8, desktop: 1, large: 1.1 },
      lineHeightScale: { mobile: 1.1, tablet: 1.15, desktop: 1.2, large: 1.2 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["secondary-cta", "decorative-elements"],
        tablet: ["decorative-elements"],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: [],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "critical",
  },

  HeroSplit: {
    componentType: "HeroSplit",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "2rem", tablet: "2rem", desktop: "3rem", large: "4rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.7, tablet: 0.85, desktop: 1, large: 1.05 },
      lineHeightScale: { mobile: 1.15, tablet: 1.2, desktop: 1.25, large: 1.25 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "critical",
  },

  HeroVideo: {
    componentType: "HeroVideo",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.7, tablet: 0.85, desktop: 1, large: 1.1 },
      lineHeightScale: { mobile: 1.1, tablet: 1.15, desktop: 1.2, large: 1.2 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["video-autoplay"], // Replace with static image on mobile
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "static-image",
    touchOptimized: true,
    priority: "critical",
  },

  HeroCarousel: {
    componentType: "HeroCarousel",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false, // Carousel is always single-column
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "0", tablet: "0", desktop: "0", large: "0" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.65, tablet: 0.8, desktop: 1, large: 1.05 },
      lineHeightScale: { mobile: 1.1, tablet: 1.15, desktop: 1.2, large: 1.2 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["navigation-arrows"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["swipe-indicators"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "swipeable",
    touchOptimized: true,
    priority: "critical",
  },

  // -------------------------------------------------------------------------
  // FEATURES COMPONENTS
  // -------------------------------------------------------------------------
  Features: {
    componentType: "Features",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2.5rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "compact",
    touchOptimized: true,
    priority: "high",
  },

  FeatureGrid: {
    componentType: "FeatureGrid",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false, // Grid adapts column count
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.25rem", desktop: "1.5rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "single-column",
    touchOptimized: true,
    priority: "high",
  },

  FeatureAlternating: {
    componentType: "FeatureAlternating",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "2rem", tablet: "2rem", desktop: "3rem", large: "4rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1.05 },
      lineHeightScale: { mobile: 1.5, tablet: 1.5, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // TESTIMONIALS COMPONENTS
  // -------------------------------------------------------------------------
  Testimonials: {
    componentType: "Testimonials",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 3 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["company-logo"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "card",
    touchOptimized: true,
    priority: "medium",
  },

  TestimonialCarousel: {
    componentType: "TestimonialCarousel",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["navigation-arrows"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["swipe-indicators"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "swipeable",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // PRICING COMPONENTS
  // -------------------------------------------------------------------------
  Pricing: {
    componentType: "Pricing",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["comparison-tooltip"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "high",
  },

  PricingTable: {
    componentType: "PricingTable",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false, // Use horizontal scroll on mobile
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "0", tablet: "1rem", desktop: "1.5rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.85, tablet: 0.9, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.4, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: {
        mobile: ["scroll-indicator"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "horizontal-scroll",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // FAQ COMPONENTS
  // -------------------------------------------------------------------------
  FAQ: {
    componentType: "FAQ",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "0.5rem", tablet: "0.75rem", desktop: "1rem", large: "1rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "accordion",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // CTA COMPONENTS
  // -------------------------------------------------------------------------
  CTA: {
    componentType: "CTA",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "2rem", desktop: "2rem", large: "2.5rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.85, tablet: 0.925, desktop: 1, large: 1.05 },
      lineHeightScale: { mobile: 1.3, tablet: 1.4, desktop: 1.4, large: 1.4 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["secondary-cta"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "full-width",
    touchOptimized: true,
    priority: "high",
  },

  CTABanner: {
    componentType: "CTABanner",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "between", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.3, tablet: 1.4, desktop: 1.4, large: 1.4 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // GALLERY COMPONENTS
  // -------------------------------------------------------------------------
  Gallery: {
    componentType: "Gallery",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 3, desktop: 4, large: 5 },
      gapPerBreakpoint: { mobile: "0.5rem", tablet: "0.75rem", desktop: "1rem", large: "1rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.3, tablet: 1.4, desktop: 1.4, large: 1.4 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["image-caption"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "grid-compact",
    touchOptimized: true,
    priority: "medium",
  },

  GalleryMasonry: {
    componentType: "GalleryMasonry",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 3, desktop: 4, large: 5 },
      gapPerBreakpoint: { mobile: "0.5rem", tablet: "0.75rem", desktop: "1rem", large: "1rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.3, tablet: 1.4, desktop: 1.4, large: 1.4 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "two-column",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // TEAM COMPONENTS
  // -------------------------------------------------------------------------
  Team: {
    componentType: "Team",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["bio-text", "social-links"],
        tablet: ["bio-text"],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "compact-card",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // FOOTER COMPONENTS
  // -------------------------------------------------------------------------
  Footer: {
    componentType: "Footer",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 4, large: 5 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2.5rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["newsletter-full-width"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["accordion-links"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "accordion",
    touchOptimized: true,
    priority: "high",
  },

  FooterMinimal: {
    componentType: "FooterMinimal",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1rem", desktop: "1.5rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "between", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // CONTACT COMPONENTS
  // -------------------------------------------------------------------------
  Contact: {
    componentType: "Contact",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "2rem", tablet: "2rem", desktop: "3rem", large: "4rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.5, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["map-embed"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "form-only",
    touchOptimized: true,
    priority: "high",
  },

  ContactForm: {
    componentType: "ContactForm",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.25rem", desktop: "1.5rem", large: "1.5rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "full-width",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // STATS / NUMBERS COMPONENTS
  // -------------------------------------------------------------------------
  Stats: {
    componentType: "Stats",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 3, desktop: 4, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.75, tablet: 0.875, desktop: 1, large: 1.1 },
      lineHeightScale: { mobile: 1.2, tablet: 1.3, desktop: 1.3, large: 1.3 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["stat-description"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "compact",
    touchOptimized: false,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // LOGO COMPONENTS
  // -------------------------------------------------------------------------
  LogoCloud: {
    componentType: "LogoCloud",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 3, tablet: 4, desktop: 6, large: 8 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2.5rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "scrolling",
    touchOptimized: true,
    priority: "low",
  },

  // -------------------------------------------------------------------------
  // ABOUT COMPONENTS
  // -------------------------------------------------------------------------
  About: {
    componentType: "About",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "2rem", tablet: "2rem", desktop: "3rem", large: "4rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.6, tablet: 1.7, desktop: 1.8, large: 1.8 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // SERVICES COMPONENTS
  // -------------------------------------------------------------------------
  Services: {
    componentType: "Services",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["service-details"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "card",
    touchOptimized: true,
    priority: "high",
  },

  // -------------------------------------------------------------------------
  // BLOG COMPONENTS
  // -------------------------------------------------------------------------
  Blog: {
    componentType: "Blog",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["excerpt", "read-time"],
        tablet: ["read-time"],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "compact-card",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // NEWSLETTER COMPONENTS
  // -------------------------------------------------------------------------
  Newsletter: {
    componentType: "Newsletter",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "between", large: "between" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["description"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // CONTENT COMPONENTS
  // -------------------------------------------------------------------------
  ContentSection: {
    componentType: "ContentSection",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "2rem", desktop: "2rem", large: "2.5rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.95, tablet: 1, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.7, tablet: 1.8, desktop: 1.8, large: 1.8 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "full-width",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // TABS AND ACCORDION COMPONENTS
  // -------------------------------------------------------------------------
  Tabs: {
    componentType: "Tabs",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "0.5rem", tablet: "0.75rem", desktop: "1rem", large: "1rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["tabs-list"], // Convert to dropdown on mobile
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["tabs-dropdown"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "dropdown",
    touchOptimized: true,
    priority: "medium",
  },

  Accordion: {
    componentType: "Accordion",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "0.25rem", tablet: "0.5rem", desktop: "0.5rem", large: "0.5rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "full-width",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // CAROUSEL COMPONENTS
  // -------------------------------------------------------------------------
  Carousel: {
    componentType: "Carousel",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["navigation-arrows"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["swipe-indicators", "pagination-dots"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "swipeable",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // CARD COMPONENTS
  // -------------------------------------------------------------------------
  Card: {
    componentType: "Card",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.25rem", desktop: "1.5rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "start", desktop: "start", large: "start" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "full-width",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // TIMELINE COMPONENTS
  // -------------------------------------------------------------------------
  Timeline: {
    componentType: "Timeline",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "1.5rem", tablet: "2rem", desktop: "2.5rem", large: "3rem" },
      alignmentPerBreakpoint: { mobile: "start", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.6, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["connecting-line"], // Simplify on mobile
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "simple",
    touchOptimized: true,
    priority: "low",
  },

  // -------------------------------------------------------------------------
  // MAP COMPONENTS
  // -------------------------------------------------------------------------
  Map: {
    componentType: "Map",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1rem", desktop: "1rem", large: "1rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
    },
    visibilityRules: {
      elementsToHide: {
        mobile: ["interactive-map"],
        tablet: [],
        desktop: [],
        large: [],
      },
      elementsToShow: {
        mobile: ["static-map", "directions-link"],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: "static-with-link",
    touchOptimized: true,
    priority: "low",
  },

  // -------------------------------------------------------------------------
  // VIDEO COMPONENTS
  // -------------------------------------------------------------------------
  Video: {
    componentType: "Video",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "16:9-responsive",
    touchOptimized: true,
    priority: "medium",
  },

  // -------------------------------------------------------------------------
  // SOCIAL PROOF COMPONENTS
  // -------------------------------------------------------------------------
  SocialProof: {
    componentType: "SocialProof",
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 4, large: 4 },
      gapPerBreakpoint: { mobile: "1rem", tablet: "1.5rem", desktop: "2rem", large: "2rem" },
      alignmentPerBreakpoint: { mobile: "center", tablet: "center", desktop: "center", large: "center" },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.875, tablet: 0.9375, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.4, tablet: 1.5, desktop: 1.5, large: 1.5 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "compact",
    touchOptimized: true,
    priority: "medium",
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get responsive config for a component type
 */
export function getComponentResponsiveConfig(
  componentType: string
): ComponentResponsiveConfig {
  // Return the config if it exists, otherwise return a default config
  return (
    componentResponsiveConfigs[componentType] ||
    createDefaultComponentConfig(componentType)
  );
}

/**
 * Create a default component config for unknown component types
 */
function createDefaultComponentConfig(
  componentType: string
): ComponentResponsiveConfig {
  return {
    componentType,
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: {
        mobile: "1rem",
        tablet: "1.25rem",
        desktop: "1.5rem",
        large: "2rem",
      },
      alignmentPerBreakpoint: {
        mobile: "center",
        tablet: "start",
        desktop: "start",
        large: "start",
      },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.5, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "medium",
  };
}

/**
 * Get all component types with responsive configs
 */
export function getAllResponsiveComponentTypes(): string[] {
  return Object.keys(componentResponsiveConfigs);
}

/**
 * Check if a component has a custom responsive config
 */
export function hasResponsiveConfig(componentType: string): boolean {
  return componentType in componentResponsiveConfigs;
}

/**
 * Get columns for a specific breakpoint
 */
export function getColumnsForBreakpoint(
  componentType: string,
  breakpoint: Breakpoint
): number {
  const config = getComponentResponsiveConfig(componentType);
  return config.layoutRules.columnsPerBreakpoint[breakpoint];
}

/**
 * Get gap for a specific breakpoint
 */
export function getGapForBreakpoint(
  componentType: string,
  breakpoint: Breakpoint
): string {
  const config = getComponentResponsiveConfig(componentType);
  return config.layoutRules.gapPerBreakpoint[breakpoint];
}

/**
 * Check if component should stack on mobile
 */
export function shouldStackOnMobile(componentType: string): boolean {
  const config = getComponentResponsiveConfig(componentType);
  return config.layoutRules.stackOnMobile;
}

/**
 * Get mobile variant for a component
 */
export function getMobileVariant(componentType: string): string {
  const config = getComponentResponsiveConfig(componentType);
  return config.mobileVariant ?? "stacked";
}
