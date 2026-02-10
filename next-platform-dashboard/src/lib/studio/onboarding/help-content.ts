/**
 * DRAMAC Studio Help Content
 * 
 * Content for the help panel organized by section.
 * 
 * @phase STUDIO-26
 */

import { PLATFORM } from '@/lib/constants/platform';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Help section structure
 */
export interface HelpSection {
  title: string;
  items: HelpItem[];
}

export interface HelpItem {
  title: string;
  description: string;
  icon?: string;
  link?: string; // External documentation link
  video?: string; // Tutorial video URL
  action?: string; // Internal action (e.g., 'openShortcuts')
}

// =============================================================================
// HELP CONTENT
// =============================================================================

/**
 * Help panel content organized by section
 */
export const HELP_SECTIONS: HelpSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Adding Components",
        description: "Learn how to add and arrange components on your page",
        icon: "plus-square",
        link: "/docs/studio/adding-components",
      },
      {
        title: "Editing Content",
        description: "How to edit text, images, and other content",
        icon: "edit",
        link: "/docs/studio/editing-content",
      },
      {
        title: "Using Templates",
        description: "Insert pre-designed sections to build faster",
        icon: "layout-template",
        link: "/docs/studio/templates",
      },
      {
        title: "Responsive Design",
        description: "Make your site look great on all devices",
        icon: "smartphone",
        link: "/docs/studio/responsive",
      },
    ],
  },
  {
    title: "Advanced Features",
    items: [
      {
        title: "AI Assistant",
        description: "Use AI to edit components with natural language",
        icon: "sparkles",
        link: "/docs/studio/ai-assistant",
      },
      {
        title: "Symbols",
        description: "Create reusable components that sync across pages",
        icon: "puzzle",
        link: "/docs/studio/symbols",
      },
      {
        title: "Custom CSS",
        description: "Add custom styles to your components",
        icon: "code",
        link: "/docs/studio/custom-css",
      },
      {
        title: "SEO Settings",
        description: "Optimize your pages for search engines",
        icon: "search",
        link: "/docs/studio/seo",
      },
    ],
  },
  {
    title: "Quick Reference",
    items: [
      {
        title: "Keyboard Shortcuts",
        description: "Speed up your workflow with shortcuts",
        icon: "keyboard",
        action: "openShortcuts",
      },
      {
        title: "Restart Tutorial",
        description: "Take the guided tour again",
        icon: "refresh-cw",
        action: "restartTutorial",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Video Tutorials",
        description: "Watch step-by-step video guides",
        icon: "play-circle",
        link: "https://youtube.com/@dramac",
      },
      {
        title: "Community Forum",
        description: "Get help from other DRAMAC users",
        icon: "users",
        link: `https://community.${PLATFORM.domain}`,
      },
      {
        title: "Contact Support",
        description: "Reach out to our support team",
        icon: "mail",
        link: `mailto:${PLATFORM.supportEmail}`,
      },
    ],
  },
];

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get all help items flattened
 */
export function getAllHelpItems(): HelpItem[] {
  return HELP_SECTIONS.flatMap((section) => section.items);
}

/**
 * Search help items
 */
export function searchHelpItems(query: string): HelpItem[] {
  const lowerQuery = query.toLowerCase();
  return getAllHelpItems().filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
  );
}
