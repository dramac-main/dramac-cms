import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import { HeroSection } from "./user-components/hero-section";
import { FeatureGrid } from "./user-components/feature-grid";
import { Testimonials } from "./user-components/testimonials";
import { CTASection } from "./user-components/cta-section";

// Map of all user components for Craft.js resolver
export const componentResolver = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
  HeroSection,
  FeatureGrid,
  Testimonials,
  CTASection,
};

// Component metadata for toolbox
export const componentRegistry = [
  // Layout
  {
    name: "Container",
    displayName: "Container",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
  },
  // Typography
  {
    name: "Text",
    displayName: "Text",
    description: "Text content with various styles",
    category: "typography" as const,
    icon: "Type",
    component: Text,
  },
  // Buttons
  {
    name: "Button",
    displayName: "Button",
    description: "Interactive button element",
    category: "buttons" as const,
    icon: "MousePointer",
    component: ButtonComponent,
  },
  // Media
  {
    name: "Image",
    displayName: "Image",
    description: "Display images",
    category: "media" as const,
    icon: "Image",
    component: ImageComponent,
  },
  // Sections
  {
    name: "HeroSection",
    displayName: "Hero Section",
    description: "Full-width hero with title and CTA",
    category: "sections" as const,
    icon: "LayoutTemplate",
    component: HeroSection,
  },
  {
    name: "FeatureGrid",
    displayName: "Feature Grid",
    description: "Grid of features with icons",
    category: "sections" as const,
    icon: "Grid3X3",
    component: FeatureGrid,
  },
  {
    name: "Testimonials",
    displayName: "Testimonials",
    description: "Customer testimonials section",
    category: "sections" as const,
    icon: "Quote",
    component: Testimonials,
  },
  {
    name: "CTASection",
    displayName: "Call to Action",
    description: "CTA section with buttons",
    category: "sections" as const,
    icon: "Megaphone",
    component: CTASection,
  },
];
