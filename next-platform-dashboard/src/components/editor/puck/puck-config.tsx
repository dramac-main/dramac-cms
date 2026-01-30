/**
 * Puck Editor Configuration
 * 
 * Defines all available components, their fields, and rendering logic
 * for the DRAMAC CMS visual page builder.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import type { Config } from "@puckeditor/core";
import type {
  SectionProps,
  ContainerProps,
  ColumnsProps,
  CardProps,
  SpacerProps,
  DividerProps,
  HeadingProps,
  TextProps,
  ButtonProps,
  ImageProps,
  VideoProps,
  MapProps,
  HeroProps,
  FeaturesProps,
  CTAProps,
  TestimonialsProps,
  FAQProps,
  StatsProps,
  TeamProps,
  GalleryProps,
  NavbarProps,
  FooterProps,
  SocialLinksProps,
  FormProps,
  FormFieldProps,
  ContactFormProps,
  NewsletterProps,
  ProductGridProps,
  ProductCardProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";

// Import render components
import {
  SectionRender,
  ContainerRender,
  ColumnsRender,
  CardRender,
  SpacerRender,
  DividerRender,
} from "./components/layout";

import {
  HeadingRender,
  TextRender,
} from "./components/typography";

import {
  ButtonRender,
} from "./components/buttons";

import {
  ImageRender,
  VideoRender,
  MapRender,
} from "./components/media";

import {
  HeroRender,
  FeaturesRender,
  CTARender,
  TestimonialsRender,
  FAQRender,
  StatsRender,
  TeamRender,
  GalleryRender,
} from "./components/sections";

import {
  NavbarRender,
  FooterRender,
  SocialLinksRender,
} from "./components/navigation";

import {
  FormRender,
  FormFieldRender,
  ContactFormRender,
  NewsletterRender,
} from "./components/forms";

import {
  ProductGridRender,
  ProductCardRender,
} from "./components/ecommerce";

// Standard field options
const alignmentOptions = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const paddingOptions = [
  { label: "None", value: "none" },
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
  { label: "Extra Large", value: "xl" },
];

const sizeOptions = [
  { label: "Small", value: "sm" },
  { label: "Medium", value: "md" },
  { label: "Large", value: "lg" },
];

const columnOptions = [
  { label: "2 Columns", value: 2 },
  { label: "3 Columns", value: 3 },
  { label: "4 Columns", value: 4 },
];

const maxWidthOptions = [
  { label: "Small (640px)", value: "sm" },
  { label: "Medium (768px)", value: "md" },
  { label: "Large (1024px)", value: "lg" },
  { label: "Extra Large (1280px)", value: "xl" },
  { label: "Full Width", value: "full" },
];

/**
 * Puck Editor Configuration
 * 
 * This configuration defines all available components for the visual editor.
 */
export const puckConfig: Config = {
  // Root configuration (page-level settings)
  root: {
    fields: {
      title: {
        type: "text",
        label: "Page Title",
      },
      description: {
        type: "textarea",
        label: "Page Description",
      },
    },
    defaultProps: {
      title: "",
      description: "",
    },
    render: (({ children }: { children: React.ReactNode }) => (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )) as any,
  },

  // Categories for component organization
  categories: {
    layout: {
      title: "Layout",
      components: ["Section", "Container", "Columns", "Card", "Spacer", "Divider"],
    },
    typography: {
      title: "Typography",
      components: ["Heading", "Text"],
    },
    buttons: {
      title: "Buttons",
      components: ["Button"],
    },
    media: {
      title: "Media",
      components: ["Image", "Video", "Map"],
    },
    sections: {
      title: "Sections",
      components: ["Hero", "Features", "CTA", "Testimonials", "FAQ", "Stats", "Team", "Gallery"],
    },
    navigation: {
      title: "Navigation",
      components: ["Navbar", "Footer", "SocialLinks"],
    },
    forms: {
      title: "Forms",
      components: ["Form", "FormField", "ContactForm", "Newsletter"],
    },
    ecommerce: {
      title: "E-Commerce",
      components: ["ProductGrid", "ProductCard"],
    },
  },

  // Component definitions
  components: {
    // ============================================
    // LAYOUT COMPONENTS
    // ============================================

    Section: {
      label: "Section",
      fields: {
        backgroundColor: { type: "text", label: "Background Color" },
        backgroundImage: { type: "text", label: "Background Image URL" },
        padding: {
          type: "select",
          label: "Padding",
          options: paddingOptions,
        },
        maxWidth: {
          type: "select",
          label: "Max Width",
          options: maxWidthOptions,
        },
        minHeight: { type: "number", label: "Min Height (px)" },
      },
      defaultProps: {
        backgroundColor: "",
        backgroundImage: "",
        padding: "md",
        maxWidth: "xl",
        minHeight: 0,
      } as SectionProps,
      render: SectionRender as any,
    },

    Container: {
      label: "Container",
      fields: {
        maxWidth: {
          type: "select",
          label: "Max Width",
          options: maxWidthOptions,
        },
        padding: {
          type: "select",
          label: "Padding",
          options: paddingOptions.slice(0, 4),
        },
        backgroundColor: { type: "text", label: "Background Color" },
      },
      defaultProps: {
        maxWidth: "xl",
        padding: "md",
        backgroundColor: "",
      } as ContainerProps,
      render: ContainerRender as any,
    },

    Columns: {
      label: "Columns",
      fields: {
        columns: {
          type: "select",
          label: "Number of Columns",
          options: [
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
            { label: "4 Columns", value: 4 },
          ],
        },
        gap: {
          type: "select",
          label: "Gap",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        verticalAlign: {
          type: "select",
          label: "Vertical Align",
          options: [
            { label: "Top", value: "top" },
            { label: "Center", value: "center" },
            { label: "Bottom", value: "bottom" },
            { label: "Stretch", value: "stretch" },
          ],
        },
        reverseOnMobile: { type: "toggle", label: "Reverse on Mobile" },
      },
      defaultProps: {
        columns: 2,
        gap: "md",
        verticalAlign: "top",
        reverseOnMobile: false,
      } as ColumnsProps,
      render: ColumnsRender as any,
    },

    Card: {
      label: "Card",
      fields: {
        padding: {
          type: "select",
          label: "Padding",
          options: paddingOptions.slice(0, 4),
        },
        shadow: {
          type: "select",
          label: "Shadow",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        borderRadius: {
          type: "select",
          label: "Border Radius",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        backgroundColor: { type: "text", label: "Background Color" },
        border: { type: "toggle", label: "Show Border" },
      },
      defaultProps: {
        padding: "md",
        shadow: "sm",
        borderRadius: "md",
        backgroundColor: "",
        border: true,
      } as CardProps,
      render: CardRender as any,
    },

    Spacer: {
      label: "Spacer",
      fields: {
        height: { type: "number", label: "Height (px)" },
        mobileHeight: { type: "number", label: "Mobile Height (px)" },
      },
      defaultProps: {
        height: 40,
        mobileHeight: 20,
      } as SpacerProps,
      render: SpacerRender as any,
    },

    Divider: {
      label: "Divider",
      fields: {
        color: { type: "text", label: "Color" },
        thickness: { type: "number", label: "Thickness (px)" },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Solid", value: "solid" },
            { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" },
          ],
        },
        margin: {
          type: "select",
          label: "Margin",
          options: paddingOptions.slice(0, 4),
        },
      },
      defaultProps: {
        color: "",
        thickness: 1,
        style: "solid",
        margin: "md",
      } as DividerProps,
      render: DividerRender as any,
    },

    // ============================================
    // TYPOGRAPHY COMPONENTS
    // ============================================

    Heading: {
      label: "Heading",
      fields: {
        text: { type: "text", label: "Text" },
        level: {
          type: "select",
          label: "Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
            { label: "H4", value: "h4" },
            { label: "H5", value: "h5" },
            { label: "H6", value: "h6" },
          ],
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: alignmentOptions,
        },
        color: { type: "text", label: "Color" },
      },
      defaultProps: {
        text: "Heading",
        level: "h2",
        alignment: "left",
        color: "",
      } as HeadingProps,
      render: HeadingRender as any,
    },

    Text: {
      label: "Text",
      fields: {
        text: { type: "textarea", label: "Text" },
        alignment: {
          type: "select",
          label: "Alignment",
          options: [
            ...alignmentOptions,
            { label: "Justify", value: "justify" },
          ],
        },
        color: { type: "text", label: "Color" },
        fontSize: {
          type: "select",
          label: "Font Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Base", value: "base" },
            { label: "Large", value: "lg" },
            { label: "Extra Large", value: "xl" },
          ],
        },
      },
      defaultProps: {
        text: "Enter your text here...",
        alignment: "left",
        color: "",
        fontSize: "base",
      } as TextProps,
      render: TextRender as any,
    },

    // ============================================
    // BUTTON COMPONENTS
    // ============================================

    Button: {
      label: "Button",
      fields: {
        text: { type: "text", label: "Text" },
        link: { type: "text", label: "Link URL" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
            { label: "Outline", value: "outline" },
            { label: "Ghost", value: "ghost" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        fullWidth: { type: "toggle", label: "Full Width" },
        openInNewTab: { type: "toggle", label: "Open in New Tab" },
      },
      defaultProps: {
        text: "Click me",
        link: "#",
        variant: "primary",
        size: "md",
        fullWidth: false,
        openInNewTab: false,
      } as ButtonProps,
      render: ButtonRender as any,
    },

    // ============================================
    // MEDIA COMPONENTS
    // ============================================

    Image: {
      label: "Image",
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        width: {
          type: "select",
          label: "Width",
          options: [
            { label: "Auto", value: "auto" },
            { label: "Full Width", value: "full" },
            { label: "Fixed", value: "fixed" },
          ],
        },
        fixedWidth: { type: "number", label: "Fixed Width (px)" },
        height: {
          type: "select",
          label: "Height",
          options: [
            { label: "Auto", value: "auto" },
            { label: "Fixed", value: "fixed" },
          ],
        },
        fixedHeight: { type: "number", label: "Fixed Height (px)" },
        objectFit: {
          type: "select",
          label: "Object Fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
            { label: "Fill", value: "fill" },
          ],
        },
        borderRadius: {
          type: "select",
          label: "Border Radius",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Full", value: "full" },
          ],
        },
      },
      defaultProps: {
        src: "",
        alt: "",
        width: "full",
        fixedWidth: 400,
        height: "auto",
        fixedHeight: 300,
        objectFit: "cover",
        borderRadius: "none",
      } as ImageProps,
      render: ImageRender as any,
    },

    Video: {
      label: "Video",
      fields: {
        url: { type: "text", label: "Video URL" },
        type: {
          type: "select",
          label: "Type",
          options: [
            { label: "YouTube", value: "youtube" },
            { label: "Vimeo", value: "vimeo" },
            { label: "File", value: "file" },
          ],
        },
        autoplay: { type: "toggle", label: "Autoplay" },
        muted: { type: "toggle", label: "Muted" },
        loop: { type: "toggle", label: "Loop" },
        controls: { type: "toggle", label: "Show Controls" },
        aspectRatio: {
          type: "select",
          label: "Aspect Ratio",
          options: [
            { label: "16:9", value: "16:9" },
            { label: "4:3", value: "4:3" },
            { label: "1:1", value: "1:1" },
            { label: "9:16", value: "9:16" },
          ],
        },
      },
      defaultProps: {
        url: "",
        type: "youtube",
        autoplay: false,
        muted: false,
        loop: false,
        controls: true,
        aspectRatio: "16:9",
      } as VideoProps,
      render: VideoRender as any,
    },

    Map: {
      label: "Map",
      fields: {
        address: { type: "text", label: "Address" },
        latitude: { type: "number", label: "Latitude" },
        longitude: { type: "number", label: "Longitude" },
        zoom: { type: "number", label: "Zoom Level" },
        height: { type: "number", label: "Height (px)" },
        style: {
          type: "select",
          label: "Map Style",
          options: [
            { label: "Roadmap", value: "roadmap" },
            { label: "Satellite", value: "satellite" },
            { label: "Hybrid", value: "hybrid" },
            { label: "Terrain", value: "terrain" },
          ],
        },
      },
      defaultProps: {
        address: "",
        latitude: 0,
        longitude: 0,
        zoom: 15,
        height: 400,
        style: "roadmap",
      } as MapProps,
      render: MapRender as any,
    },

    // ============================================
    // SECTION COMPONENTS
    // ============================================

    Hero: {
      label: "Hero Section",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        buttonText: { type: "text", label: "Button Text" },
        buttonLink: { type: "text", label: "Button Link" },
        backgroundColor: { type: "text", label: "Background Color" },
        backgroundImage: { type: "text", label: "Background Image URL" },
        textColor: { type: "text", label: "Text Color" },
        alignment: {
          type: "select",
          label: "Alignment",
          options: alignmentOptions,
        },
        minHeight: { type: "number", label: "Min Height (px)" },
        overlay: { type: "toggle", label: "Show Overlay" },
        overlayOpacity: { type: "number", label: "Overlay Opacity (%)" },
      },
      defaultProps: {
        title: "Welcome to Our Website",
        subtitle: "Build amazing experiences with our visual editor",
        buttonText: "Get Started",
        buttonLink: "#",
        backgroundColor: "#0f0d1a",
        backgroundImage: "",
        textColor: "#ffffff",
        alignment: "center",
        minHeight: 500,
        overlay: true,
        overlayOpacity: 50,
      } as HeroProps,
      render: HeroRender as any,
    },

    Features: {
      label: "Features",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        columns: {
          type: "select",
          label: "Columns",
          options: columnOptions,
        },
        features: {
          type: "array",
          label: "Features",
          arrayFields: {
            icon: { type: "text", label: "Icon Name" },
            title: { type: "text", label: "Title" },
            description: { type: "textarea", label: "Description" },
          },
        },
      },
      defaultProps: {
        title: "Our Features",
        subtitle: "Everything you need to succeed",
        columns: 3,
        features: [
          { icon: "Zap", title: "Fast", description: "Lightning fast performance" },
          { icon: "Shield", title: "Secure", description: "Enterprise-grade security" },
          { icon: "Heart", title: "Easy", description: "Simple and intuitive" },
        ],
      } as FeaturesProps,
      render: FeaturesRender as any,
    },

    CTA: {
      label: "Call to Action",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        buttonText: { type: "text", label: "Button Text" },
        buttonLink: { type: "text", label: "Button Link" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
        alignment: {
          type: "select",
          label: "Alignment",
          options: alignmentOptions,
        },
      },
      defaultProps: {
        title: "Ready to get started?",
        subtitle: "Join thousands of satisfied customers today.",
        buttonText: "Get Started",
        buttonLink: "#",
        backgroundColor: "",
        textColor: "",
        alignment: "center",
      } as CTAProps,
      render: CTARender as any,
    },

    Testimonials: {
      label: "Testimonials",
      fields: {
        title: { type: "text", label: "Title" },
        testimonials: {
          type: "array",
          label: "Testimonials",
          arrayFields: {
            quote: { type: "textarea", label: "Quote" },
            author: { type: "text", label: "Author" },
            role: { type: "text", label: "Role" },
            avatar: { type: "text", label: "Avatar URL" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "1 Column", value: 1 },
            { label: "2 Columns", value: 2 },
            { label: "3 Columns", value: 3 },
          ],
        },
        showAvatar: { type: "toggle", label: "Show Avatar" },
      },
      defaultProps: {
        title: "What Our Customers Say",
        testimonials: [
          {
            quote: "This product has transformed our business!",
            author: "John Doe",
            role: "CEO, Company",
            avatar: "",
          },
        ],
        columns: 2,
        showAvatar: true,
      } as TestimonialsProps,
      render: TestimonialsRender as any,
    },

    FAQ: {
      label: "FAQ",
      fields: {
        title: { type: "text", label: "Title" },
        faqs: {
          type: "array",
          label: "Questions",
          arrayFields: {
            question: { type: "text", label: "Question" },
            answer: { type: "textarea", label: "Answer" },
          },
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Accordion", value: "accordion" },
            { label: "List", value: "list" },
          ],
        },
      },
      defaultProps: {
        title: "Frequently Asked Questions",
        faqs: [
          { question: "What is your return policy?", answer: "We offer a 30-day return policy." },
          { question: "How do I contact support?", answer: "You can reach us at support@example.com" },
        ],
        style: "accordion",
      } as FAQProps,
      render: FAQRender as any,
    },

    Stats: {
      label: "Stats",
      fields: {
        stats: {
          type: "array",
          label: "Statistics",
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
            prefix: { type: "text", label: "Prefix" },
            suffix: { type: "text", label: "Suffix" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: columnOptions,
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: alignmentOptions,
        },
      },
      defaultProps: {
        stats: [
          { value: "10K", label: "Customers", prefix: "", suffix: "+" },
          { value: "99", label: "Uptime", prefix: "", suffix: "%" },
          { value: "24/7", label: "Support", prefix: "", suffix: "" },
        ],
        columns: 3,
        alignment: "center",
      } as StatsProps,
      render: StatsRender as any,
    },

    Team: {
      label: "Team",
      fields: {
        title: { type: "text", label: "Title" },
        members: {
          type: "array",
          label: "Team Members",
          arrayFields: {
            name: { type: "text", label: "Name" },
            role: { type: "text", label: "Role" },
            image: { type: "text", label: "Image URL" },
            bio: { type: "textarea", label: "Bio" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: columnOptions,
        },
      },
      defaultProps: {
        title: "Meet Our Team",
        members: [
          { name: "Jane Doe", role: "CEO", image: "", bio: "Leading the company" },
          { name: "John Smith", role: "CTO", image: "", bio: "Building the tech" },
        ],
        columns: 3,
      } as TeamProps,
      render: TeamRender as any,
    },

    Gallery: {
      label: "Gallery",
      fields: {
        images: {
          type: "array",
          label: "Images",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            caption: { type: "text", label: "Caption" },
          },
        },
        columns: {
          type: "select",
          label: "Columns",
          options: columnOptions,
        },
        gap: {
          type: "select",
          label: "Gap",
          options: [
            { label: "None", value: "none" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
        aspectRatio: {
          type: "select",
          label: "Aspect Ratio",
          options: [
            { label: "Square", value: "square" },
            { label: "Landscape", value: "landscape" },
            { label: "Portrait", value: "portrait" },
            { label: "Auto", value: "auto" },
          ],
        },
        lightbox: { type: "toggle", label: "Enable Lightbox" },
      },
      defaultProps: {
        images: [],
        columns: 3,
        gap: "md",
        aspectRatio: "square",
        lightbox: true,
      } as GalleryProps,
      render: GalleryRender as any,
    },

    // ============================================
    // NAVIGATION COMPONENTS
    // ============================================

    Navbar: {
      label: "Navigation Bar",
      fields: {
        logo: { type: "text", label: "Logo URL" },
        logoText: { type: "text", label: "Logo Text" },
        links: {
          type: "array",
          label: "Links",
          arrayFields: {
            text: { type: "text", label: "Text" },
            href: { type: "text", label: "URL" },
          },
        },
        sticky: { type: "toggle", label: "Sticky" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
      },
      defaultProps: {
        logo: "",
        logoText: "LOGO",
        links: [
          { text: "Home", href: "/" },
          { text: "About", href: "/about" },
          { text: "Contact", href: "/contact" },
        ],
        sticky: false,
        backgroundColor: "",
        textColor: "",
      } as NavbarProps,
      render: NavbarRender as any,
    },

    Footer: {
      label: "Footer",
      fields: {
        logo: { type: "text", label: "Logo URL" },
        description: { type: "textarea", label: "Description" },
        columns: {
          type: "array",
          label: "Link Columns",
          arrayFields: {
            title: { type: "text", label: "Column Title" },
          },
        },
        copyright: { type: "text", label: "Copyright Text" },
        backgroundColor: { type: "text", label: "Background Color" },
        textColor: { type: "text", label: "Text Color" },
      },
      defaultProps: {
        logo: "",
        description: "Building amazing experiences.",
        columns: [],
        copyright: "© 2026 Company. All rights reserved.",
        backgroundColor: "",
        textColor: "",
      } as FooterProps,
      render: FooterRender as any,
    },

    SocialLinks: {
      label: "Social Links",
      fields: {
        links: {
          type: "array",
          label: "Social Links",
          arrayFields: {
            platform: {
              type: "select",
              label: "Platform",
              options: [
                { label: "Facebook", value: "facebook" },
                { label: "Twitter", value: "twitter" },
                { label: "Instagram", value: "instagram" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "YouTube", value: "youtube" },
                { label: "TikTok", value: "tiktok" },
                { label: "GitHub", value: "github" },
              ],
            },
            url: { type: "text", label: "URL" },
          },
        },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        color: { type: "text", label: "Color" },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Filled", value: "filled" },
            { label: "Outline", value: "outline" },
            { label: "Minimal", value: "minimal" },
          ],
        },
      },
      defaultProps: {
        links: [
          { platform: "facebook", url: "#" },
          { platform: "twitter", url: "#" },
          { platform: "instagram", url: "#" },
        ],
        size: "md",
        color: "",
        style: "filled",
      } as SocialLinksProps,
      render: SocialLinksRender as any,
    },

    // ============================================
    // FORM COMPONENTS
    // ============================================

    Form: {
      label: "Form",
      fields: {
        formId: { type: "text", label: "Form ID" },
        submitUrl: { type: "text", label: "Submit URL" },
        submitText: { type: "text", label: "Submit Button Text" },
        successMessage: { type: "text", label: "Success Message" },
        backgroundColor: { type: "text", label: "Background Color" },
        padding: {
          type: "select",
          label: "Padding",
          options: paddingOptions.slice(0, 4),
        },
      },
      defaultProps: {
        formId: "",
        submitUrl: "",
        submitText: "Submit",
        successMessage: "Thank you for your submission!",
        backgroundColor: "",
        padding: "md",
      } as FormProps,
      render: FormRender as any,
    },

    FormField: {
      label: "Form Field",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        type: {
          type: "select",
          label: "Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Phone", value: "tel" },
            { label: "Textarea", value: "textarea" },
            { label: "Select", value: "select" },
            { label: "Checkbox", value: "checkbox" },
            { label: "Radio", value: "radio" },
          ],
        },
        placeholder: { type: "text", label: "Placeholder" },
        required: { type: "toggle", label: "Required" },
      },
      defaultProps: {
        name: "field",
        label: "Field Label",
        type: "text",
        placeholder: "",
        required: false,
      } as FormFieldProps,
      render: FormFieldRender as any,
    },

    ContactForm: {
      label: "Contact Form",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        submitText: { type: "text", label: "Submit Button Text" },
        successMessage: { type: "text", label: "Success Message" },
        recipientEmail: { type: "text", label: "Recipient Email" },
      },
      defaultProps: {
        title: "Contact Us",
        subtitle: "We'd love to hear from you.",
        submitText: "Send Message",
        successMessage: "Thank you! We'll be in touch soon.",
        recipientEmail: "",
      } as ContactFormProps,
      render: ContactFormRender as any,
    },

    Newsletter: {
      label: "Newsletter",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        placeholder: { type: "text", label: "Email Placeholder" },
        buttonText: { type: "text", label: "Button Text" },
        successMessage: { type: "text", label: "Success Message" },
        provider: {
          type: "select",
          label: "Provider",
          options: [
            { label: "Resend", value: "resend" },
            { label: "Mailchimp", value: "mailchimp" },
            { label: "Custom", value: "custom" },
          ],
        },
        listId: { type: "text", label: "List ID" },
      },
      defaultProps: {
        title: "Subscribe to our newsletter",
        subtitle: "Get the latest updates in your inbox.",
        placeholder: "Enter your email",
        buttonText: "Subscribe",
        successMessage: "Thanks for subscribing!",
        provider: "custom",
        listId: "",
      } as NewsletterProps,
      render: NewsletterRender as any,
    },

    // ============================================
    // E-COMMERCE COMPONENTS
    // ============================================

    ProductGrid: {
      label: "Product Grid",
      fields: {
        siteId: { type: "text", label: "Site ID" },
        columns: {
          type: "select",
          label: "Columns",
          options: columnOptions,
        },
        limit: { type: "number", label: "Limit" },
        category: { type: "text", label: "Category" },
        sortBy: {
          type: "select",
          label: "Sort By",
          options: [
            { label: "Name", value: "name" },
            { label: "Price", value: "price" },
            { label: "Created", value: "created" },
          ],
        },
        sortOrder: {
          type: "select",
          label: "Sort Order",
          options: [
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ],
        },
        showPrice: { type: "toggle", label: "Show Price" },
        showAddToCart: { type: "toggle", label: "Show Add to Cart" },
      },
      defaultProps: {
        siteId: "",
        columns: 3,
        limit: 12,
        category: "",
        sortBy: "created",
        sortOrder: "desc",
        showPrice: true,
        showAddToCart: true,
      } as ProductGridProps,
      render: ProductGridRender as any,
    },

    ProductCard: {
      label: "Product Card",
      fields: {
        productId: { type: "text", label: "Product ID" },
        showDescription: { type: "toggle", label: "Show Description" },
        showPrice: { type: "toggle", label: "Show Price" },
        showAddToCart: { type: "toggle", label: "Show Add to Cart" },
        imageAspect: {
          type: "select",
          label: "Image Aspect",
          options: [
            { label: "Square", value: "square" },
            { label: "Landscape", value: "landscape" },
            { label: "Portrait", value: "portrait" },
          ],
        },
      },
      defaultProps: {
        productId: "",
        showDescription: true,
        showPrice: true,
        showAddToCart: true,
        imageAspect: "square",
      } as ProductCardProps,
      render: ProductCardRender as any,
    },
  },
};

export default puckConfig;
