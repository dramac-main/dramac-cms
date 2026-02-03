/**
 * Puck Page Generation Types & Constants
 * 
 * Client-safe types and constants for page generation.
 * This file contains NO server-side code or Anthropic SDK imports.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 * 
 * @phase STUDIO-27 - Updated to use standalone types
 */

import type { PuckData } from "@/types/puck";

// ============================================
// Types
// ============================================

export interface PageGenerationContext {
  description: string;
  industry?: string;
  style?: "modern" | "classic" | "minimal" | "bold" | "playful";
  colorScheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  targetAudience?: string;
  sections?: readonly string[] | string[];
  tone?: "professional" | "friendly" | "casual" | "luxury" | "technical";
  existingBranding?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
  };
}

export interface GenerationResult {
  success: boolean;
  data?: PuckData;
  error?: string;
  tokensUsed?: number;
}

export interface ComponentGenerationContext {
  componentType: string;
  pageContext: PageGenerationContext;
  position?: "start" | "middle" | "end";
  existingContent?: string[];
}

// ============================================
// Page Templates
// ============================================

export const PAGE_TEMPLATES = {
  landing: {
    name: "Landing Page",
    description: "High-converting landing page with hero, features, testimonials, pricing, FAQ, and CTA",
    sections: ["Hero", "Features", "Testimonials", "Pricing", "FAQ", "CTA", "Footer"] as const,
  },
  business: {
    name: "Business Website",
    description: "Professional business website with services, team, and contact sections",
    sections: ["Navbar", "Hero", "Features", "Team", "Testimonials", "ContactForm", "Footer"] as const,
  },
  portfolio: {
    name: "Portfolio",
    description: "Creative portfolio with projects showcase and about section",
    sections: ["Hero", "ProjectsGrid", "Skills", "About", "ContactForm"] as const,
  },
  ecommerce: {
    name: "E-commerce",
    description: "Product-focused page with features and social proof",
    sections: ["Navbar", "Hero", "ProductGrid", "Features", "Reviews", "CTA", "Footer"] as const,
  },
  blog: {
    name: "Blog/Content",
    description: "Content-focused layout with article sections",
    sections: ["Hero", "BlogPosts", "Categories", "Newsletter", "Footer"] as const,
  },
} as const;

export type PageTemplateType = keyof typeof PAGE_TEMPLATES;

// ============================================
// Style Presets
// ============================================

export const STYLE_PRESETS = {
  modern: {
    name: "Modern",
    description: "Clean, contemporary design with subtle gradients and rounded corners",
    characteristics: ["Minimalist", "Spacious", "Gradient accents", "Smooth animations"],
  },
  classic: {
    name: "Classic",
    description: "Timeless, professional design with traditional layouts",
    characteristics: ["Elegant", "Trustworthy", "Structured", "Professional"],
  },
  minimal: {
    name: "Minimal",
    description: "Ultra-clean with maximum whitespace and simple typography",
    characteristics: ["Simple", "Clean", "Focused", "Typography-driven"],
  },
  bold: {
    name: "Bold",
    description: "Eye-catching with strong colors and dynamic layouts",
    characteristics: ["Vibrant", "Energetic", "Attention-grabbing", "Modern"],
  },
} as const;

export type StylePresetType = keyof typeof STYLE_PRESETS;

// ============================================
// Industry Presets
// ============================================

export const INDUSTRY_PRESETS = {
  technology: {
    name: "Technology",
    description: "Tech-focused with modern UI and innovation themes",
    keywords: ["innovation", "cutting-edge", "digital", "smart", "future"],
  },
  healthcare: {
    name: "Healthcare",
    description: "Professional healthcare with trust and care emphasis",
    keywords: ["health", "care", "professional", "trust", "wellbeing"],
  },
  finance: {
    name: "Finance",
    description: "Professional financial services with security focus",
    keywords: ["secure", "trusted", "professional", "growth", "invest"],
  },
  realestate: {
    name: "Real Estate",
    description: "Property-focused with lifestyle and location themes",
    keywords: ["home", "property", "location", "lifestyle", "investment"],
  },
  restaurant: {
    name: "Restaurant",
    description: "Food & dining with ambiance and experience focus",
    keywords: ["delicious", "fresh", "experience", "cuisine", "dining"],
  },
  fitness: {
    name: "Fitness",
    description: "Health & fitness with energy and results themes",
    keywords: ["strong", "healthy", "energy", "results", "transformation"],
  },
} as const;

export type IndustryPresetType = keyof typeof INDUSTRY_PRESETS;
