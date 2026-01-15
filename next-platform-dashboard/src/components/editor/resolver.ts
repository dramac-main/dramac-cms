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
import { Gallery } from "./user-components/gallery";
import { FAQ } from "./user-components/faq";
import { Team } from "./user-components/team";
import { Stats } from "./user-components/stats";

// New Phase 49 components
import { Root } from "./user-components/root";
import { Section } from "./user-components/section";
import { Heading } from "./user-components/heading";
import { Columns } from "./user-components/columns";
import { Column } from "./user-components/column";
import { Spacer } from "./user-components/spacer";
import { Divider } from "./user-components/divider";
import { Card } from "./user-components/card";
import { Hero } from "./user-components/hero";
import { Features } from "./user-components/features";
import { CTA } from "./user-components/cta";
import { Navbar } from "./user-components/navbar";
import { Video } from "./user-components/video";
import { Map as MapComponent } from "./user-components/map";
import { SocialLinks } from "./user-components/social-links";
import { Form } from "./user-components/form";
import { FormField } from "./user-components/form-field";
import { Image } from "./user-components/image";
import { Button } from "./user-components/button";

// Map of all user components for Craft.js resolver
export const componentResolver = {
  // Legacy components
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
  Gallery,
  FAQ,
  Team,
  Stats,
  // New Phase 49 components
  Root,
  Section,
  Heading,
  Columns,
  Column,
  Spacer,
  Divider,
  Card,
  Hero,
  Features,
  CTA,
  Navbar,
  Video,
  MapEmbed: MapComponent,
  SocialLinks,
  Form,
  FormField,
  ImageNew: Image,
  ButtonNew: Button,
};

// Component metadata for toolbox
export const componentRegistry = [
  // ===== NEW PHASE 49 COMPONENTS =====
  // Page Root (internal, not in toolbox)
  
  // Layout Components
  {
    name: "Section",
    displayName: "Section",
    description: "Page section with layout options",
    category: "layout" as const,
    icon: "LayoutList",
    component: Section,
  },
  {
    name: "Columns",
    displayName: "Columns",
    description: "Multi-column layout grid",
    category: "layout" as const,
    icon: "Columns3",
    component: Columns,
  },
  {
    name: "Card",
    displayName: "Card",
    description: "Card container with styling",
    category: "layout" as const,
    icon: "CreditCard",
    component: Card,
  },
  {
    name: "Spacer",
    displayName: "Spacer",
    description: "Vertical spacing element",
    category: "layout" as const,
    icon: "Space",
    component: Spacer,
  },
  {
    name: "Divider",
    displayName: "Divider",
    description: "Horizontal divider line",
    category: "layout" as const,
    icon: "Minus",
    component: Divider,
  },
  
  // Typography Components
  {
    name: "Heading",
    displayName: "Heading",
    description: "Heading text (H1-H6)",
    category: "typography" as const,
    icon: "Heading",
    component: Heading,
  },
  {
    name: "Text",
    displayName: "Text",
    description: "Paragraph text content",
    category: "typography" as const,
    icon: "Type",
    component: Text,
  },
  
  // Button Components
  {
    name: "ButtonNew",
    displayName: "Button",
    description: "Interactive button with variants",
    category: "buttons" as const,
    icon: "MousePointer",
    component: Button,
  },
  
  // Media Components
  {
    name: "ImageNew",
    displayName: "Image",
    description: "Display images with styling",
    category: "media" as const,
    icon: "Image",
    component: Image,
  },
  {
    name: "Video",
    displayName: "Video",
    description: "Embed YouTube, Vimeo or video files",
    category: "media" as const,
    icon: "Play",
    component: Video,
  },
  {
    name: "MapEmbed",
    displayName: "Map",
    description: "Google Maps embed",
    category: "media" as const,
    icon: "Map",
    component: MapComponent,
  },
  
  // Section Components
  {
    name: "Hero",
    displayName: "Hero",
    description: "Hero section with title and CTA",
    category: "sections" as const,
    icon: "LayoutTemplate",
    component: Hero,
  },
  {
    name: "Features",
    displayName: "Features",
    description: "Feature grid with icons",
    category: "sections" as const,
    icon: "Grid3X3",
    component: Features,
  },
  {
    name: "CTA",
    displayName: "Call to Action",
    description: "CTA section with button",
    category: "sections" as const,
    icon: "Megaphone",
    component: CTA,
  },
  {
    name: "Navbar",
    displayName: "Navigation Bar",
    description: "Site navigation header",
    category: "navigation" as const,
    icon: "Menu",
    component: Navbar,
  },
  {
    name: "SocialLinks",
    displayName: "Social Links",
    description: "Social media links",
    category: "navigation" as const,
    icon: "Share2",
    component: SocialLinks,
  },
  
  // Form Components
  {
    name: "Form",
    displayName: "Form",
    description: "Form container with submit",
    category: "forms" as const,
    icon: "FileInput",
    component: Form,
  },
  {
    name: "FormField",
    displayName: "Form Field",
    description: "Input field for forms",
    category: "forms" as const,
    icon: "TextCursor",
    component: FormField,
  },
  
  // ===== LEGACY COMPONENTS =====
  // Navigation
  {
    name: "Navigation",
    displayName: "Navigation (Legacy)",
    description: "Site header with logo and links",
    category: "navigation" as const,
    icon: "Menu",
    component: Navigation,
  },
  // Layout
  {
    name: "Container",
    displayName: "Container (Legacy)",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
  },
  // Sections
  {
    name: "HeroSection",
    displayName: "Hero Section (Legacy)",
    description: "Full-width hero with title and CTA",
    category: "sections" as const,
    icon: "LayoutTemplate",
    component: HeroSection,
  },
  {
    name: "FeatureGrid",
    displayName: "Feature Grid (Legacy)",
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
    displayName: "Call to Action (Legacy)",
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
  // Buttons
  {
    name: "Button",
    displayName: "Button (Legacy)",
    description: "Interactive button element",
    category: "buttons" as const,
    icon: "MousePointer",
    component: ButtonComponent,
  },
  // Media
  {
    name: "Image",
    displayName: "Image (Legacy)",
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
  // New Section Components
  {
    name: "Gallery",
    displayName: "Gallery",
    description: "Image gallery with lightbox",
    category: "sections" as const,
    icon: "Images",
    component: Gallery,
  },
  {
    name: "FAQ",
    displayName: "FAQ",
    description: "Frequently asked questions accordion",
    category: "sections" as const,
    icon: "HelpCircle",
    component: FAQ,
  },
  {
    name: "Team",
    displayName: "Team",
    description: "Team member cards",
    category: "sections" as const,
    icon: "Users",
    component: Team,
  },
  {
    name: "Stats",
    displayName: "Stats",
    description: "Animated statistics counters",
    category: "sections" as const,
    icon: "TrendingUp",
    component: Stats,
  },
];
