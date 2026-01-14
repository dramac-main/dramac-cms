"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Define where each module injects its components
export type InjectionPoint =
  | "head" // <head> scripts/styles
  | "body-start" // Start of <body>
  | "body-end" // End of <body>
  | "before-content" // Before main content
  | "after-content" // After main content
  | "footer"; // Footer area

// Module component definitions
interface ModuleComponent {
  slug: string;
  injectionPoint: InjectionPoint;
  component: ComponentType<{ settings: Record<string, unknown> }>;
}

// Analytics Module Components
const AnalyticsScript = dynamic(
  () => import("@/components/modules/analytics/analytics-script"),
  { ssr: false }
);

// SEO Module Components
const SEOHead = dynamic(
  () => import("@/components/modules/seo/seo-head"),
  { ssr: true }
);

// Forms Module Components
const FormsStyles = dynamic(
  () => import("@/components/modules/forms/forms-styles"),
  { ssr: true }
);

// Blog Module Components
const BlogWidget = dynamic(
  () => import("@/components/modules/blog/blog-widget"),
  { ssr: true }
);

// Registry of all module components
export const moduleComponents: ModuleComponent[] = [
  {
    slug: "analytics",
    injectionPoint: "body-end",
    component: AnalyticsScript,
  },
  {
    slug: "seo-pro",
    injectionPoint: "head",
    component: SEOHead,
  },
  {
    slug: "forms-pro",
    injectionPoint: "head",
    component: FormsStyles,
  },
  {
    slug: "blog",
    injectionPoint: "after-content",
    component: BlogWidget,
  },
];

// Get components for a specific injection point
export function getComponentsForInjectionPoint(
  point: InjectionPoint,
  enabledSlugs: Set<string>
): ModuleComponent[] {
  return moduleComponents.filter(
    (mc) => mc.injectionPoint === point && enabledSlugs.has(mc.slug)
  );
}
