import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import { HeroSection } from "./user-components/hero-section";
import { FeatureGrid } from "./user-components/feature-grid";
import { Testimonials } from "./user-components/testimonials";
import { CTASection } from "./user-components/cta-section";
import { ContactForm } from "./user-components/contact-form";
import { Newsletter } from "./user-components/newsletter";
import { Navigation } from "./user-components/navigation";
import { Footer } from "./user-components/footer";

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
  ContactForm,
  Newsletter,
  Navigation,
  Footer,
};

// Component metadata for toolbox
export const componentRegistry = [
  // Navigation
  {
    name: "Navigation",
    displayName: "Navigation",
    description: "Site header with logo and links",
    category: "navigation" as const,
    icon: "Menu",
    component: Navigation,
  },
  // Layout
  {
    name: "Container",
    displayName: "Container",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
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
  // Forms
  {
    name: "ContactForm",
    displayName: "Contact Form",
    description: "Contact form with fields",
    category: "forms" as const,
    icon: "Mail",
    component: ContactForm,
  },
  {
    name: "Newsletter",
    displayName: "Newsletter",
    description: "Email subscription form",
    category: "forms" as const,
    icon: "Inbox",
    component: Newsletter,
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
  // Navigation (Footer)
  {
    name: "Footer",
    displayName: "Footer",
    description: "Site footer with links",
    category: "navigation" as const,
    icon: "PanelBottom",
    component: Footer,
  },
];
