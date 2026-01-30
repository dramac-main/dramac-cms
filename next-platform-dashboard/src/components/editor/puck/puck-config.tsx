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
  // Advanced Layout Types (PHASE-ED-02A)
  GridProps,
  FlexboxProps,
  TabsContainerProps,
  AccordionContainerProps,
  ModalTriggerProps,
  DrawerTriggerProps,
  AspectRatioProps,
  StackProps,
  StickyContainerProps,
  ScrollAreaProps,
  // Content Types (PHASE-ED-02B)
  RichTextProps,
  QuoteProps,
  CodeBlockProps,
  ListProps,
  TableProps,
  BadgeProps,
  AlertProps,
  ProgressProps,
  TooltipWrapperProps,
  TimelineProps,
  PricingTableProps,
  CounterProps,
  AvatarProps,
  AvatarGroupProps,
  IconProps,
  // Advanced Form Types (PHASE-ED-02C)
  MultiStepFormProps,
  RatingInputProps,
  FileUploadProps,
  DatePickerInputProps,
  RangeSliderProps,
  SwitchInputProps,
  CheckboxGroupProps,
  RadioGroupProps,
  SearchInputProps,
  PasswordInputProps,
  OTPInputProps,
  SelectInputProps,
  TagInputProps,
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

// Advanced Layout Components (PHASE-ED-02A)
import {
  GridRender,
  FlexboxRender,
  TabsContainerRender,
  AccordionContainerRender,
  ModalTriggerRender,
  DrawerTriggerRender,
  AspectRatioRender,
  StackRender,
  StickyContainerRender,
  ScrollAreaRender,
} from "./components/layout-advanced";

// Content Components (PHASE-ED-02B)
import {
  RichTextRender,
  QuoteRender,
  CodeBlockRender,
  ListRender,
  TableRender,
  BadgeRender,
  AlertRender,
  ProgressRender,
  TooltipWrapperRender,
  TimelineRender,
  PricingTableRender,
  CounterRender,
  AvatarRender,
  AvatarGroupRender,
  IconRender,
} from "./components/content";

// Advanced Form Components (PHASE-ED-02C)
import {
  MultiStepFormRender,
  RatingInputRender,
  FileUploadRender,
  DatePickerInputRender,
  RangeSliderRender,
  SwitchInputRender,
  CheckboxGroupRender,
  RadioGroupRender,
  SearchInputRender,
  PasswordInputRender,
  OTPInputRender,
  SelectInputRender,
  TagInputRender,
} from "./components/forms-advanced";

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
    layoutAdvanced: {
      title: "Advanced Layout",
      components: ["Grid", "Flexbox", "TabsContainer", "AccordionContainer", "ModalTrigger", "DrawerTrigger", "AspectRatio", "Stack", "StickyContainer", "ScrollArea"],
    },
    typography: {
      title: "Typography",
      components: ["Heading", "Text"],
    },
    content: {
      title: "Content",
      components: ["RichText", "Quote", "CodeBlock", "List", "Table", "Badge", "Alert", "Progress", "TooltipWrapper", "Timeline", "PricingTable", "Counter", "Avatar", "AvatarGroup", "Icon"],
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
    formsAdvanced: {
      title: "Advanced Forms",
      components: ["MultiStepForm", "RatingInput", "FileUpload", "DatePickerInput", "RangeSlider", "SwitchInput", "CheckboxGroup", "RadioGroup", "SearchInput", "PasswordInput", "OTPInput", "SelectInput", "TagInput"],
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

    // ============================================
    // ADVANCED LAYOUT COMPONENTS (PHASE-ED-02A)
    // ============================================

    Grid: {
      label: "Grid",
      fields: {
        columns: { type: "number", label: "Columns" },
        rows: { type: "number", label: "Rows" },
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
        autoFlow: {
          type: "select",
          label: "Auto Flow",
          options: [
            { label: "Row", value: "row" },
            { label: "Column", value: "column" },
            { label: "Dense", value: "dense" },
          ],
        },
        alignItems: {
          type: "select",
          label: "Align Items",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Stretch", value: "stretch" },
          ],
        },
        justifyItems: {
          type: "select",
          label: "Justify Items",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Stretch", value: "stretch" },
          ],
        },
      },
      defaultProps: {
        columns: 3,
        rows: undefined,
        gap: "md",
        autoFlow: "row",
        alignItems: "stretch",
        justifyItems: "stretch",
      } as GridProps,
      render: GridRender as any,
    },

    Flexbox: {
      label: "Flexbox",
      fields: {
        direction: {
          type: "select",
          label: "Direction",
          options: [
            { label: "Row", value: "row" },
            { label: "Row Reverse", value: "row-reverse" },
            { label: "Column", value: "column" },
            { label: "Column Reverse", value: "column-reverse" },
          ],
        },
        wrap: {
          type: "select",
          label: "Wrap",
          options: [
            { label: "No Wrap", value: "nowrap" },
            { label: "Wrap", value: "wrap" },
            { label: "Wrap Reverse", value: "wrap-reverse" },
          ],
        },
        justifyContent: {
          type: "select",
          label: "Justify Content",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Space Between", value: "between" },
            { label: "Space Around", value: "around" },
            { label: "Space Evenly", value: "evenly" },
          ],
        },
        alignItems: {
          type: "select",
          label: "Align Items",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Stretch", value: "stretch" },
            { label: "Baseline", value: "baseline" },
          ],
        },
        gap: {
          type: "select",
          label: "Gap",
          options: paddingOptions,
        },
      },
      defaultProps: {
        direction: "row",
        wrap: "nowrap",
        justifyContent: "start",
        alignItems: "start",
        gap: "md",
      } as FlexboxProps,
      render: FlexboxRender as any,
    },

    TabsContainer: {
      label: "Tabs Container",
      fields: {
        tabs: {
          type: "array",
          label: "Tabs",
          arrayFields: {
            id: { type: "text", label: "ID" },
            label: { type: "text", label: "Label" },
          },
        },
        defaultTab: { type: "number", label: "Default Tab Index" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Underline", value: "underline" },
            { label: "Pills", value: "pills" },
            { label: "Boxed", value: "boxed" },
          ],
        },
        orientation: {
          type: "select",
          label: "Orientation",
          options: [
            { label: "Horizontal", value: "horizontal" },
            { label: "Vertical", value: "vertical" },
          ],
        },
      },
      defaultProps: {
        tabs: [
          { id: "tab1", label: "Tab 1" },
          { id: "tab2", label: "Tab 2" },
          { id: "tab3", label: "Tab 3" },
        ],
        defaultTab: 0,
        variant: "underline",
        orientation: "horizontal",
      } as TabsContainerProps,
      render: TabsContainerRender as any,
    },

    AccordionContainer: {
      label: "Accordion Container",
      fields: {
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            id: { type: "text", label: "ID" },
            title: { type: "text", label: "Title" },
          },
        },
        multiple: { type: "toggle", label: "Allow Multiple Open" },
        defaultOpen: { type: "number", label: "Default Open Index" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Bordered", value: "bordered" },
            { label: "Separated", value: "separated" },
          ],
        },
        iconPosition: {
          type: "select",
          label: "Icon Position",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        items: [
          { id: "item1", title: "Item 1" },
          { id: "item2", title: "Item 2" },
          { id: "item3", title: "Item 3" },
        ],
        multiple: false,
        defaultOpen: 0,
        variant: "default",
        iconPosition: "right",
      } as AccordionContainerProps,
      render: AccordionContainerRender as any,
    },

    ModalTrigger: {
      label: "Modal Trigger",
      fields: {
        triggerText: { type: "text", label: "Trigger Text" },
        modalTitle: { type: "text", label: "Modal Title" },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra Large", value: "xl" },
            { label: "Full", value: "full" },
          ],
        },
        closeOnOverlay: { type: "toggle", label: "Close on Overlay Click" },
        closeOnEscape: { type: "toggle", label: "Close on Escape" },
        showCloseButton: { type: "toggle", label: "Show Close Button" },
      },
      defaultProps: {
        triggerText: "Open Modal",
        modalTitle: "Modal Title",
        size: "md",
        closeOnOverlay: true,
        closeOnEscape: true,
        showCloseButton: true,
      } as ModalTriggerProps,
      render: ModalTriggerRender as any,
    },

    DrawerTrigger: {
      label: "Drawer Trigger",
      fields: {
        triggerText: { type: "text", label: "Trigger Text" },
        drawerTitle: { type: "text", label: "Drawer Title" },
        position: {
          type: "select",
          label: "Position",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Full", value: "full" },
          ],
        },
        overlay: { type: "toggle", label: "Show Overlay" },
        closeOnOverlay: { type: "toggle", label: "Close on Overlay Click" },
      },
      defaultProps: {
        triggerText: "Open Drawer",
        drawerTitle: "Drawer Title",
        position: "right",
        size: "md",
        overlay: true,
        closeOnOverlay: true,
      } as DrawerTriggerProps,
      render: DrawerTriggerRender as any,
    },

    AspectRatio: {
      label: "Aspect Ratio",
      fields: {
        ratio: {
          type: "select",
          label: "Ratio",
          options: [
            { label: "1:1 (Square)", value: "1:1" },
            { label: "4:3", value: "4:3" },
            { label: "16:9", value: "16:9" },
            { label: "21:9", value: "21:9" },
            { label: "3:2", value: "3:2" },
            { label: "2:3 (Portrait)", value: "2:3" },
            { label: "Custom", value: "custom" },
          ],
        },
        customRatio: { type: "number", label: "Custom Ratio (width/height)" },
        maxWidth: { type: "text", label: "Max Width" },
      },
      defaultProps: {
        ratio: "16:9",
        customRatio: undefined,
        maxWidth: "100%",
      } as AspectRatioProps,
      render: AspectRatioRender as any,
    },

    Stack: {
      label: "Stack",
      fields: {
        direction: {
          type: "select",
          label: "Direction",
          options: [
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
          ],
        },
        gap: {
          type: "select",
          label: "Gap",
          options: paddingOptions,
        },
        align: {
          type: "select",
          label: "Align",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Stretch", value: "stretch" },
          ],
        },
        justify: {
          type: "select",
          label: "Justify",
          options: [
            { label: "Start", value: "start" },
            { label: "Center", value: "center" },
            { label: "End", value: "end" },
            { label: "Between", value: "between" },
          ],
        },
        wrap: { type: "toggle", label: "Wrap" },
        divider: { type: "toggle", label: "Show Dividers" },
      },
      defaultProps: {
        direction: "vertical",
        gap: "md",
        align: "stretch",
        justify: "start",
        wrap: false,
        divider: false,
      } as StackProps,
      render: StackRender as any,
    },

    StickyContainer: {
      label: "Sticky Container",
      fields: {
        position: {
          type: "select",
          label: "Sticky Position",
          options: [
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
          ],
        },
        offset: { type: "number", label: "Offset (px)" },
        zIndex: { type: "number", label: "Z-Index" },
      },
      defaultProps: {
        position: "top",
        offset: 0,
        zIndex: 50,
      } as StickyContainerProps,
      render: StickyContainerRender as any,
    },

    ScrollArea: {
      label: "Scroll Area",
      fields: {
        maxHeight: { type: "text", label: "Max Height" },
        maxWidth: { type: "text", label: "Max Width" },
        scrollbarStyle: {
          type: "select",
          label: "Scrollbar Style",
          options: [
            { label: "Default", value: "default" },
            { label: "Thin", value: "thin" },
            { label: "Hidden", value: "hidden" },
          ],
        },
        scrollDirection: {
          type: "select",
          label: "Scroll Direction",
          options: [
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
            { label: "Both", value: "both" },
          ],
        },
      },
      defaultProps: {
        maxHeight: "400px",
        maxWidth: "100%",
        scrollbarStyle: "default",
        scrollDirection: "vertical",
      } as ScrollAreaProps,
      render: ScrollAreaRender as any,
    },

    // ============================================
    // CONTENT COMPONENTS (PHASE-ED-02B)
    // ============================================

    RichText: {
      label: "Rich Text",
      fields: {
        content: { type: "textarea", label: "HTML Content" },
        typography: {
          type: "select",
          label: "Typography Style",
          options: [
            { label: "Prose", value: "prose" },
            { label: "Compact", value: "compact" },
            { label: "Large", value: "large" },
          ],
        },
        preserveWhitespace: { type: "toggle", label: "Preserve Whitespace" },
      },
      defaultProps: {
        content: "<p>Enter your rich text content here...</p>",
        typography: "prose",
        preserveWhitespace: false,
      } as RichTextProps,
      render: RichTextRender as any,
    },

    Quote: {
      label: "Quote",
      fields: {
        text: { type: "textarea", label: "Quote Text" },
        author: { type: "text", label: "Author" },
        authorTitle: { type: "text", label: "Author Title" },
        authorImage: { type: "text", label: "Author Image URL" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Large", value: "large" },
            { label: "Card", value: "card" },
            { label: "Border", value: "border" },
          ],
        },
        alignment: {
          type: "select",
          label: "Alignment",
          options: alignmentOptions,
        },
      },
      defaultProps: {
        text: "This is an inspiring quote.",
        author: "Author Name",
        authorTitle: "Title",
        authorImage: "",
        variant: "default",
        alignment: "left",
      } as QuoteProps,
      render: QuoteRender as any,
    },

    CodeBlock: {
      label: "Code Block",
      fields: {
        code: { type: "textarea", label: "Code" },
        language: {
          type: "select",
          label: "Language",
          options: [
            { label: "JavaScript", value: "javascript" },
            { label: "TypeScript", value: "typescript" },
            { label: "Python", value: "python" },
            { label: "HTML", value: "html" },
            { label: "CSS", value: "css" },
            { label: "JSON", value: "json" },
            { label: "Bash", value: "bash" },
            { label: "Plain Text", value: "text" },
          ],
        },
        showLineNumbers: { type: "toggle", label: "Show Line Numbers" },
        showCopyButton: { type: "toggle", label: "Show Copy Button" },
        title: { type: "text", label: "Title/Filename" },
        highlightLines: { type: "text", label: "Highlight Lines (e.g., 1,3,5-7)" },
      },
      defaultProps: {
        code: "console.log('Hello, World!');",
        language: "javascript",
        showLineNumbers: true,
        showCopyButton: true,
        title: "",
        highlightLines: "",
      } as CodeBlockProps,
      render: CodeBlockRender as any,
    },

    List: {
      label: "List",
      fields: {
        items: {
          type: "array",
          label: "List Items",
          arrayFields: {
            text: { type: "text", label: "Item Text" },
          },
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Unordered", value: "unordered" },
            { label: "Ordered", value: "ordered" },
            { label: "Check", value: "check" },
            { label: "Arrow", value: "arrow" },
            { label: "Custom Icon", value: "custom" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        spacing: {
          type: "select",
          label: "Spacing",
          options: [
            { label: "Compact", value: "compact" },
            { label: "Normal", value: "normal" },
            { label: "Relaxed", value: "relaxed" },
          ],
        },
      },
      defaultProps: {
        items: [
          { text: "First item" },
          { text: "Second item" },
          { text: "Third item" },
        ],
        variant: "unordered",
        size: "md",
        spacing: "normal",
      } as ListProps,
      render: ListRender as any,
    },

    Table: {
      label: "Table",
      fields: {
        headers: {
          type: "array",
          label: "Headers",
          arrayFields: {
            text: { type: "text", label: "Header Text" },
          },
        },
        rows: { type: "textarea", label: "Rows (JSON array)" },
        striped: { type: "toggle", label: "Striped Rows" },
        bordered: { type: "toggle", label: "Bordered" },
        hoverable: { type: "toggle", label: "Hoverable Rows" },
        compact: { type: "toggle", label: "Compact" },
      },
      defaultProps: {
        headers: [
          { key: "col1", label: "Column 1" },
          { key: "col2", label: "Column 2" },
          { key: "col3", label: "Column 3" },
        ],
        rows: [
          { col1: "Data 1", col2: "Data 2", col3: "Data 3" },
          { col1: "Data 4", col2: "Data 5", col3: "Data 6" },
        ],
        striped: true,
        bordered: false,
        hoverable: true,
        compact: false,
      } as TableProps,
      render: TableRender as any,
    },

    Badge: {
      label: "Badge",
      fields: {
        text: { type: "text", label: "Text" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Secondary", value: "secondary" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
            { label: "Info", value: "info" },
            { label: "Outline", value: "outline" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        rounded: { type: "toggle", label: "Pill Shape" },
        dot: { type: "toggle", label: "Show Dot" },
        removable: { type: "toggle", label: "Removable" },
      },
      defaultProps: {
        text: "Badge",
        variant: "default",
        size: "md",
        rounded: false,
        dot: false,
        removable: false,
      } as BadgeProps,
      render: BadgeRender as any,
    },

    Alert: {
      label: "Alert",
      fields: {
        title: { type: "text", label: "Title" },
        message: { type: "textarea", label: "Message" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Info", value: "info" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
          ],
        },
        dismissible: { type: "toggle", label: "Dismissible" },
        showIcon: { type: "toggle", label: "Show Icon" },
      },
      defaultProps: {
        title: "Alert Title",
        message: "This is an alert message.",
        variant: "info",
        dismissible: false,
        showIcon: true,
      } as AlertProps,
      render: AlertRender as any,
    },

    Progress: {
      label: "Progress",
      fields: {
        value: { type: "number", label: "Value" },
        max: { type: "number", label: "Max" },
        label: { type: "text", label: "Label" },
        showValue: { type: "toggle", label: "Show Value" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Success", value: "success" },
            { label: "Warning", value: "warning" },
            { label: "Error", value: "error" },
            { label: "Gradient", value: "gradient" },
          ],
        },
        animated: { type: "toggle", label: "Animated" },
        striped: { type: "toggle", label: "Striped" },
      },
      defaultProps: {
        value: 60,
        max: 100,
        label: "",
        showValue: true,
        size: "md",
        variant: "default",
        animated: false,
        striped: false,
      } as ProgressProps,
      render: ProgressRender as any,
    },

    TooltipWrapper: {
      label: "Tooltip Wrapper",
      fields: {
        content: { type: "textarea", label: "Tooltip Content" },
        position: {
          type: "select",
          label: "Position",
          options: [
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
        },
        delay: { type: "number", label: "Delay (ms)" },
      },
      defaultProps: {
        content: "Tooltip content",
        position: "top",
        delay: 0,
      } as TooltipWrapperProps,
      render: TooltipWrapperRender as any,
    },

    Timeline: {
      label: "Timeline",
      fields: {
        items: {
          type: "array",
          label: "Timeline Items",
          arrayFields: {
            title: { type: "text", label: "Title" },
            description: { type: "textarea", label: "Description" },
            date: { type: "text", label: "Date" },
          },
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Alternating", value: "alternating" },
            { label: "Compact", value: "compact" },
          ],
        },
        lineColor: { type: "text", label: "Line Color" },
      },
      defaultProps: {
        items: [
          { title: "Event 1", description: "Description for event 1", date: "2024-01-01" },
          { title: "Event 2", description: "Description for event 2", date: "2024-02-01" },
          { title: "Event 3", description: "Description for event 3", date: "2024-03-01" },
        ],
        variant: "default",
        lineColor: "",
      } as TimelineProps,
      render: TimelineRender as any,
    },

    PricingTable: {
      label: "Pricing Table",
      fields: {
        plans: {
          type: "array",
          label: "Plans",
          arrayFields: {
            name: { type: "text", label: "Plan Name" },
            price: { type: "text", label: "Price" },
            period: { type: "text", label: "Period" },
            description: { type: "textarea", label: "Description" },
            highlighted: { type: "toggle", label: "Highlighted" },
          },
        },
        currency: { type: "text", label: "Currency Symbol" },
        columns: { type: "number", label: "Columns" },
      },
      defaultProps: {
        plans: [
          { name: "Basic", price: "9", period: "/month", description: "For individuals", features: ["Feature 1", "Feature 2"], highlighted: false },
          { name: "Pro", price: "29", period: "/month", description: "For teams", features: ["Everything in Basic", "Feature 3", "Feature 4"], highlighted: true },
          { name: "Enterprise", price: "99", period: "/month", description: "For organizations", features: ["Everything in Pro", "Feature 5", "Feature 6"], highlighted: false },
        ],
        currency: "$",
        columns: 3,
      } as PricingTableProps,
      render: PricingTableRender as any,
    },

    Counter: {
      label: "Counter",
      fields: {
        endValue: { type: "number", label: "End Value" },
        startValue: { type: "number", label: "Start Value" },
        duration: { type: "number", label: "Duration (ms)" },
        prefix: { type: "text", label: "Prefix" },
        suffix: { type: "text", label: "Suffix" },
        decimals: { type: "number", label: "Decimal Places" },
        separator: { type: "text", label: "Thousands Separator" },
        label: { type: "text", label: "Label" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
      },
      defaultProps: {
        endValue: 1000,
        startValue: 0,
        duration: 2000,
        prefix: "",
        suffix: "",
        decimals: 0,
        separator: ",",
        label: "",
        size: "md",
      } as CounterProps,
      render: CounterRender as any,
    },

    Avatar: {
      label: "Avatar",
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt Text" },
        fallback: { type: "text", label: "Fallback Initials" },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Extra Small", value: "xs" },
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
            { label: "Extra Large", value: "xl" },
          ],
        },
        shape: {
          type: "select",
          label: "Shape",
          options: [
            { label: "Circle", value: "circle" },
            { label: "Square", value: "square" },
            { label: "Rounded", value: "rounded" },
          ],
        },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "None", value: "" },
            { label: "Online", value: "online" },
            { label: "Offline", value: "offline" },
            { label: "Away", value: "away" },
            { label: "Busy", value: "busy" },
          ],
        },
      },
      defaultProps: {
        src: "",
        alt: "Avatar",
        fallback: "U",
        size: "md",
        shape: "circle",
        status: undefined,
      } as AvatarProps,
      render: AvatarRender as any,
    },

    AvatarGroup: {
      label: "Avatar Group",
      fields: {
        avatars: {
          type: "array",
          label: "Avatars",
          arrayFields: {
            src: { type: "text", label: "Image URL" },
            alt: { type: "text", label: "Alt Text" },
            fallback: { type: "text", label: "Fallback" },
          },
        },
        max: { type: "number", label: "Max Display" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        overlap: {
          type: "select",
          label: "Overlap",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        avatars: [
          { src: "", alt: "User 1", fallback: "U1" },
          { src: "", alt: "User 2", fallback: "U2" },
          { src: "", alt: "User 3", fallback: "U3" },
        ],
        max: 5,
        size: "md",
        overlap: "md",
      } as AvatarGroupProps,
      render: AvatarGroupRender as any,
    },

    Icon: {
      label: "Icon",
      fields: {
        name: {
          type: "select",
          label: "Icon",
          options: [
            { label: "Star", value: "star" },
            { label: "Heart", value: "heart" },
            { label: "Check", value: "check" },
            { label: "X", value: "x" },
            { label: "Arrow Right", value: "arrow-right" },
            { label: "Arrow Left", value: "arrow-left" },
            { label: "Mail", value: "mail" },
            { label: "Phone", value: "phone" },
            { label: "Settings", value: "settings" },
            { label: "User", value: "user" },
          ],
        },
        size: { type: "number", label: "Size (px)" },
        color: { type: "text", label: "Color" },
        strokeWidth: { type: "number", label: "Stroke Width" },
      },
      defaultProps: {
        name: "star",
        size: 24,
        color: "currentColor",
        strokeWidth: 2,
      } as IconProps,
      render: IconRender as any,
    },

    // ============================================
    // ADVANCED FORM COMPONENTS (PHASE-ED-02C)
    // ============================================

    MultiStepForm: {
      label: "Multi-Step Form",
      fields: {
        steps: {
          type: "array",
          label: "Steps",
          arrayFields: {
            id: { type: "text", label: "Step ID" },
            title: { type: "text", label: "Step Title" },
            description: { type: "textarea", label: "Description" },
          },
        },
        showProgress: { type: "toggle", label: "Show Progress" },
        progressVariant: {
          type: "select",
          label: "Progress Variant",
          options: [
            { label: "Steps", value: "steps" },
            { label: "Bar", value: "bar" },
            { label: "Dots", value: "dots" },
          ],
        },
        allowSkip: { type: "toggle", label: "Allow Skip" },
        submitText: { type: "text", label: "Submit Button Text" },
        nextText: { type: "text", label: "Next Button Text" },
        prevText: { type: "text", label: "Previous Button Text" },
      },
      defaultProps: {
        steps: [
          { id: "step1", title: "Step 1", description: "Basic information" },
          { id: "step2", title: "Step 2", description: "Additional details" },
          { id: "step3", title: "Step 3", description: "Confirmation" },
        ],
        currentStep: 0,
        showProgress: true,
        progressVariant: "steps",
        allowSkip: false,
        submitText: "Submit",
        nextText: "Next",
        prevText: "Previous",
      } as MultiStepFormProps,
      render: MultiStepFormRender as any,
    },

    RatingInput: {
      label: "Rating Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        maxRating: { type: "number", label: "Max Rating" },
        defaultValue: { type: "number", label: "Default Value" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        icon: {
          type: "select",
          label: "Icon",
          options: [
            { label: "Star", value: "star" },
            { label: "Heart", value: "heart" },
            { label: "Circle", value: "circle" },
          ],
        },
        color: { type: "text", label: "Color" },
        allowHalf: { type: "toggle", label: "Allow Half Rating" },
        readonly: { type: "toggle", label: "Read Only" },
        showValue: { type: "toggle", label: "Show Value" },
      },
      defaultProps: {
        name: "rating",
        label: "Rating",
        maxRating: 5,
        defaultValue: 0,
        size: "md",
        icon: "star",
        color: "#facc15",
        allowHalf: false,
        readonly: false,
        showValue: false,
      } as RatingInputProps,
      render: RatingInputRender as any,
    },

    FileUpload: {
      label: "File Upload",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        accept: { type: "text", label: "Accepted Types" },
        multiple: { type: "toggle", label: "Multiple Files" },
        maxSize: { type: "number", label: "Max Size (MB)" },
        maxFiles: { type: "number", label: "Max Files" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Dropzone", value: "dropzone" },
            { label: "Button", value: "button" },
            { label: "Avatar", value: "avatar" },
          ],
        },
        showPreview: { type: "toggle", label: "Show Preview" },
        helpText: { type: "text", label: "Help Text" },
        required: { type: "toggle", label: "Required" },
      },
      defaultProps: {
        name: "file",
        label: "Upload File",
        accept: "image/*",
        multiple: false,
        maxSize: 5,
        maxFiles: 5,
        variant: "dropzone",
        showPreview: true,
        helpText: "",
        required: false,
      } as FileUploadProps,
      render: FileUploadRender as any,
    },

    DatePickerInput: {
      label: "Date Picker",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        placeholder: { type: "text", label: "Placeholder" },
        format: { type: "text", label: "Format" },
        minDate: { type: "text", label: "Min Date (YYYY-MM-DD)" },
        maxDate: { type: "text", label: "Max Date (YYYY-MM-DD)" },
        showTime: { type: "toggle", label: "Show Time" },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
      },
      defaultProps: {
        name: "date",
        label: "Select Date",
        placeholder: "Select date",
        format: "YYYY-MM-DD",
        minDate: "",
        maxDate: "",
        showTime: false,
        required: false,
        helpText: "",
      } as DatePickerInputProps,
      render: DatePickerInputRender as any,
    },

    RangeSlider: {
      label: "Range Slider",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        min: { type: "number", label: "Min Value" },
        max: { type: "number", label: "Max Value" },
        step: { type: "number", label: "Step" },
        defaultValue: { type: "number", label: "Default Value" },
        showValue: { type: "toggle", label: "Show Value" },
        showMinMax: { type: "toggle", label: "Show Min/Max" },
        unit: { type: "text", label: "Unit" },
      },
      defaultProps: {
        name: "range",
        label: "Range",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        showValue: true,
        showMinMax: true,
        unit: "",
      } as RangeSliderProps,
      render: RangeSliderRender as any,
    },

    SwitchInput: {
      label: "Switch",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        description: { type: "text", label: "Description" },
        defaultChecked: { type: "toggle", label: "Default Checked" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        labelPosition: {
          type: "select",
          label: "Label Position",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
        },
        required: { type: "toggle", label: "Required" },
      },
      defaultProps: {
        name: "switch",
        label: "Enable feature",
        description: "",
        defaultChecked: false,
        size: "md",
        labelPosition: "right",
        required: false,
      } as SwitchInputProps,
      render: SwitchInputRender as any,
    },

    CheckboxGroup: {
      label: "Checkbox Group",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        options: {
          type: "array",
          label: "Options",
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
            description: { type: "text", label: "Description" },
          },
        },
        orientation: {
          type: "select",
          label: "Orientation",
          options: [
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
          ],
        },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
      },
      defaultProps: {
        name: "checkboxes",
        label: "Select Options",
        options: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ],
        defaultValue: [],
        orientation: "vertical",
        required: false,
        helpText: "",
      } as CheckboxGroupProps,
      render: CheckboxGroupRender as any,
    },

    RadioGroup: {
      label: "Radio Group",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        options: {
          type: "array",
          label: "Options",
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
            description: { type: "text", label: "Description" },
          },
        },
        orientation: {
          type: "select",
          label: "Orientation",
          options: [
            { label: "Vertical", value: "vertical" },
            { label: "Horizontal", value: "horizontal" },
          ],
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Cards", value: "cards" },
            { label: "Buttons", value: "buttons" },
          ],
        },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
      },
      defaultProps: {
        name: "radio",
        label: "Select One",
        options: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ],
        defaultValue: "",
        orientation: "vertical",
        variant: "default",
        required: false,
        helpText: "",
      } as RadioGroupProps,
      render: RadioGroupRender as any,
    },

    SearchInput: {
      label: "Search Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        placeholder: { type: "text", label: "Placeholder" },
        size: {
          type: "select",
          label: "Size",
          options: sizeOptions,
        },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Default", value: "default" },
            { label: "Filled", value: "filled" },
            { label: "Outline", value: "outline" },
          ],
        },
        showClearButton: { type: "toggle", label: "Show Clear Button" },
        showSearchIcon: { type: "toggle", label: "Show Search Icon" },
        iconPosition: {
          type: "select",
          label: "Icon Position",
          options: [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        name: "search",
        placeholder: "Search...",
        size: "md",
        variant: "default",
        showClearButton: true,
        showSearchIcon: true,
        iconPosition: "left",
      } as SearchInputProps,
      render: SearchInputRender as any,
    },

    PasswordInput: {
      label: "Password Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        placeholder: { type: "text", label: "Placeholder" },
        showToggle: { type: "toggle", label: "Show Toggle" },
        showStrength: { type: "toggle", label: "Show Strength" },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
        minLength: { type: "number", label: "Min Length" },
      },
      defaultProps: {
        name: "password",
        label: "Password",
        placeholder: "Enter password",
        showToggle: true,
        showStrength: false,
        required: false,
        helpText: "",
        minLength: 8,
      } as PasswordInputProps,
      render: PasswordInputRender as any,
    },

    OTPInput: {
      label: "OTP Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        length: { type: "number", label: "Length" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Boxes", value: "boxes" },
            { label: "Underline", value: "underline" },
          ],
        },
        autoFocus: { type: "toggle", label: "Auto Focus" },
        helpText: { type: "text", label: "Help Text" },
        type: {
          type: "select",
          label: "Input Type",
          options: [
            { label: "Number", value: "number" },
            { label: "Text", value: "text" },
          ],
        },
      },
      defaultProps: {
        name: "otp",
        label: "Enter OTP",
        length: 6,
        variant: "boxes",
        autoFocus: true,
        helpText: "",
        type: "number",
      } as OTPInputProps,
      render: OTPInputRender as any,
    },

    SelectInput: {
      label: "Select Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        options: {
          type: "array",
          label: "Options",
          arrayFields: {
            value: { type: "text", label: "Value" },
            label: { type: "text", label: "Label" },
          },
        },
        placeholder: { type: "text", label: "Placeholder" },
        multiple: { type: "toggle", label: "Multiple" },
        searchable: { type: "toggle", label: "Searchable" },
        clearable: { type: "toggle", label: "Clearable" },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
      },
      defaultProps: {
        name: "select",
        label: "Select",
        options: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ],
        placeholder: "Select an option",
        multiple: false,
        searchable: false,
        clearable: true,
        required: false,
        helpText: "",
      } as SelectInputProps,
      render: SelectInputRender as any,
    },

    TagInput: {
      label: "Tag Input",
      fields: {
        name: { type: "text", label: "Field Name" },
        label: { type: "text", label: "Label" },
        placeholder: { type: "text", label: "Placeholder" },
        maxTags: { type: "number", label: "Max Tags" },
        allowDuplicates: { type: "toggle", label: "Allow Duplicates" },
        suggestions: {
          type: "array",
          label: "Suggestions",
          arrayFields: {
            value: { type: "text", label: "Value" },
          },
        },
        required: { type: "toggle", label: "Required" },
        helpText: { type: "text", label: "Help Text" },
      },
      defaultProps: {
        name: "tags",
        label: "Tags",
        placeholder: "Add a tag...",
        defaultTags: [],
        maxTags: 10,
        allowDuplicates: false,
        suggestions: [],
        required: false,
        helpText: "",
      } as TagInputProps,
      render: TagInputRender as any,
    },
  },
};

export default puckConfig;
