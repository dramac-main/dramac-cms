/**
 * Puck Starter Templates
 * PHASE-ED-07A: Template System - Categories
 * 
 * Contains starter templates that generate actual Puck component data structures.
 * These are the free templates included with every installation.
 * 
 * @phase STUDIO-27 - Updated to use standalone types
 */

import type { PuckTemplate, TemplateCategory } from "@/types/puck-templates";
import type { PuckData } from "@/types/puck";

// ============================================
// HELPER: Generate Unique IDs
// ============================================

import { generateComponentId as generateId } from "@/lib/utils/generate-id";

// ============================================
// BLANK STARTER TEMPLATE
// ============================================

export const blankTemplate: PuckTemplate = {
  id: "blank-starter",
  name: "Blank Canvas",
  slug: "blank-canvas",
  description: "Start with a completely blank page",
  category: "other",
  subcategory: "starter",
  tags: ["blank", "empty", "starter"],
  thumbnail: "/templates/blank.svg",
  isPremium: false,
  isNew: false,
  isFeatured: false,
  isPopular: true,
  popularity: 100,
  features: ["Empty canvas", "Full flexibility", "No pre-built sections"],
  sections: [],
  componentsUsed: [],
  colorScheme: {
    primary: "#6366f1",
    secondary: "#f1f5f9",
    accent: "#8b5cf6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "" } },
    content: [],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "Varies",
    difficulty: "beginner",
    componentCount: 0,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// SIMPLE LANDING PAGE TEMPLATE
// ============================================

export const simpleLandingTemplate: PuckTemplate = {
  id: "simple-landing",
  name: "Simple Landing Page",
  slug: "simple-landing-page",
  description: "A clean, minimal landing page with hero, features, and CTA",
  category: "landing",
  subcategory: "starter",
  tags: ["landing", "simple", "minimal", "starter"],
  thumbnail: "/templates/simple-landing.svg",
  isPremium: false,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 95,
  features: ["Hero section", "Features grid", "Call to action", "Footer"],
  sections: ["hero", "features", "cta", "footer"],
  componentsUsed: ["Hero", "Features", "CTA", "Footer"],
  colorScheme: {
    primary: "#6366f1",
    secondary: "#f1f5f9",
    accent: "#8b5cf6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Simple Landing Page" } },
    content: [
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Build Something Amazing",
          subtitle: "Create stunning websites with our powerful visual builder. No coding required.",
          alignment: "center",
          buttonText: "Get Started",
          buttonLink: "#",
          secondaryButtonText: "Learn More",
          secondaryButtonLink: "#features",
          backgroundType: "gradient",
          backgroundColor: "#6366f1",
          gradientFrom: "#6366f1",
          gradientTo: "#8b5cf6",
          textColor: "#ffffff",
          padding: "xl",
          showImage: false,
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Why Choose Us",
          subtitle: "Everything you need to build modern websites",
          columns: 3,
          alignment: "center",
          features: [
            {
              icon: "⚡",
              title: "Lightning Fast",
              description: "Optimized for speed and performance",
            },
            {
              icon: "🎨",
              title: "Beautiful Design",
              description: "Professional templates and components",
            },
            {
              icon: "🛡️",
              title: "Secure & Reliable",
              description: "Enterprise-grade security built-in",
            },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "CTA",
        props: {
          id: generateId(),
          title: "Ready to Get Started?",
          subtitle: "Join thousands of happy customers building with us",
          buttonText: "Start Free Trial",
          buttonLink: "#",
          buttonVariant: "default",
          alignment: "center",
          backgroundColor: "#f1f5f9",
          textColor: "#1f2937",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "Your Company",
          description: "Building the future of web development",
          columns: [
            {
              title: "Product",
              links: [
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Documentation", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Contact", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            twitter: "#",
            linkedin: "#",
            github: "#",
          },
          copyrightText: "© 2026 Your Company. All rights reserved.",
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "10 minutes",
    difficulty: "beginner",
    componentCount: 4,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// BUSINESS STARTER TEMPLATE
// ============================================

export const businessStarterTemplate: PuckTemplate = {
  id: "business-starter",
  name: "Business Starter",
  slug: "business-starter",
  description: "Professional business website with services and contact",
  category: "business",
  subcategory: "starter",
  tags: ["business", "corporate", "professional", "starter"],
  thumbnail: "/templates/business-starter.svg",
  isPremium: false,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 90,
  features: ["Navigation bar", "Hero section", "Services grid", "About section", "Contact form", "Footer"],
  sections: ["navbar", "hero", "services", "about", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Features", "Section", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#0ea5e9",
    secondary: "#f0f9ff",
    accent: "#0284c7",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Business Starter" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "YourBrand",
          links: [
            { label: "Home", href: "#" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Get Quote",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Growing Your Business Together",
          subtitle: "We provide innovative solutions to help your business thrive in the digital age.",
          alignment: "left",
          buttonText: "Our Services",
          buttonLink: "#services",
          secondaryButtonText: "Contact Us",
          secondaryButtonLink: "#contact",
          backgroundType: "color",
          backgroundColor: "#0ea5e9",
          textColor: "#ffffff",
          padding: "xl",
          showImage: true,
          imageUrl: "/images/business-hero.jpg",
          imagePosition: "right",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Our Services",
          subtitle: "Comprehensive solutions tailored to your needs",
          columns: 3,
          alignment: "center",
          features: [
            {
              icon: "📊",
              title: "Strategy Consulting",
              description: "Data-driven strategies to accelerate growth",
            },
            {
              icon: "💻",
              title: "Digital Solutions",
              description: "Modern technology for modern businesses",
            },
            {
              icon: "📈",
              title: "Market Analysis",
              description: "Deep insights into your market landscape",
            },
            {
              icon: "🤝",
              title: "Partnership",
              description: "Long-term relationships for lasting success",
            },
            {
              icon: "🎯",
              title: "Targeted Marketing",
              description: "Reach the right audience at the right time",
            },
            {
              icon: "💡",
              title: "Innovation",
              description: "Creative solutions to complex challenges",
            },
          ],
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "Section",
        props: {
          id: generateId(),
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Get in Touch",
          subtitle: "Have a question or want to work together? Send us a message!",
          fields: [
            { name: "name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel", required: false },
            { name: "message", label: "Message", type: "textarea", required: true },
          ],
          submitText: "Send Message",
          backgroundColor: "#f0f9ff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "YourBrand",
          description: "Your trusted partner for business growth",
          columns: [
            {
              title: "Services",
              links: [
                { label: "Consulting", href: "#" },
                { label: "Digital Solutions", href: "#" },
                { label: "Marketing", href: "#" },
              ],
            },
            {
              title: "Contact",
              links: [
                { label: "info@example.com", href: "mailto:info@example.com" },
                { label: "+260 977 123 456", href: "tel:+260977123456" },
                { label: "123 Business Ave", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            linkedin: "#",
            twitter: "#",
            facebook: "#",
          },
          copyrightText: "© 2026 YourBrand. All rights reserved.",
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "15 minutes",
    difficulty: "beginner",
    componentCount: 6,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// PORTFOLIO STARTER TEMPLATE
// ============================================

export const portfolioStarterTemplate: PuckTemplate = {
  id: "portfolio-starter",
  name: "Portfolio Starter",
  slug: "portfolio-starter",
  description: "Minimalist portfolio for creatives and professionals",
  category: "portfolio",
  subcategory: "starter",
  tags: ["portfolio", "creative", "minimal", "starter"],
  thumbnail: "/templates/portfolio-starter.svg",
  isPremium: false,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 88,
  features: ["Hero intro", "Work gallery", "About section", "Contact"],
  sections: ["hero", "gallery", "about", "contact"],
  componentsUsed: ["Hero", "Gallery", "Section", "Text", "ContactForm"],
  colorScheme: {
    primary: "#171717",
    secondary: "#fafafa",
    accent: "#6366f1",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Portfolio" } },
    content: [
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "John Designer",
          subtitle: "Digital Designer & Creative Director with 10+ years of experience crafting memorable brand experiences.",
          alignment: "center",
          buttonText: "View My Work",
          buttonLink: "#work",
          secondaryButtonText: "Get in Touch",
          secondaryButtonLink: "#contact",
          backgroundType: "color",
          backgroundColor: "#171717",
          textColor: "#ffffff",
          padding: "xl",
          showImage: false,
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "Selected Work",
          subtitle: "A collection of my recent projects",
          columns: 3,
          gap: "md",
          images: [
            { src: "/portfolio/project-1.jpg", alt: "Project 1", caption: "Brand Identity" },
            { src: "/portfolio/project-2.jpg", alt: "Project 2", caption: "Web Design" },
            { src: "/portfolio/project-3.jpg", alt: "Project 3", caption: "Mobile App" },
            { src: "/portfolio/project-4.jpg", alt: "Project 4", caption: "UI/UX Design" },
            { src: "/portfolio/project-5.jpg", alt: "Project 5", caption: "Illustration" },
            { src: "/portfolio/project-6.jpg", alt: "Project 6", caption: "Packaging" },
          ],
          enableLightbox: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Section",
        props: {
          id: generateId(),
          backgroundColor: "#fafafa",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Let's Work Together",
          subtitle: "Have a project in mind? I'd love to hear about it.",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "project", label: "Tell me about your project", type: "textarea", required: true },
          ],
          submitText: "Send Message",
          backgroundColor: "#171717",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "10 minutes",
    difficulty: "beginner",
    componentCount: 4,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// E-COMMERCE STARTER TEMPLATE
// ============================================

export const ecommerceStarterTemplate: PuckTemplate = {
  id: "ecommerce-starter",
  name: "E-Commerce Starter",
  slug: "ecommerce-starter",
  description: "Simple online store with product showcase",
  category: "ecommerce",
  subcategory: "starter",
  tags: ["ecommerce", "store", "shop", "products", "starter"],
  thumbnail: "/templates/ecommerce-starter.svg",
  isPremium: false,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 85,
  features: ["Navigation", "Hero banner", "Featured products", "Categories", "Newsletter", "Footer"],
  sections: ["navbar", "hero", "products", "categories", "newsletter", "footer"],
  componentsUsed: ["Navbar", "Hero", "FeaturedProducts", "ProductCategories", "Newsletter", "Footer"],
  colorScheme: {
    primary: "#f59e0b",
    secondary: "#fffbeb",
    accent: "#d97706",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Online Store" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "ShopBrand",
          links: [
            { label: "Shop", href: "#products" },
            { label: "Categories", href: "#categories" },
            { label: "About", href: "#about" },
            { label: "Contact", href: "#contact" },
          ],
          showCart: true,
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Summer Collection",
          subtitle: "Discover our latest arrivals with up to 40% off on selected items",
          alignment: "center",
          buttonText: "Shop Now",
          buttonLink: "#products",
          secondaryButtonText: "View Lookbook",
          secondaryButtonLink: "#",
          backgroundType: "image",
          backgroundImage: "/images/shop-hero.jpg",
          overlayOpacity: 0.4,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "FeaturedProducts",
        props: {
          id: generateId(),
          title: "Featured Products",
          subtitle: "Our most popular items this season",
          columns: 4,
          products: [
            { name: "Product 1", price: 49.99, image: "/products/product-1.jpg", badge: "New" },
            { name: "Product 2", price: 79.99, image: "/products/product-2.jpg", badge: "Sale" },
            { name: "Product 3", price: 59.99, image: "/products/product-3.jpg" },
            { name: "Product 4", price: 99.99, image: "/products/product-4.jpg", badge: "Popular" },
          ],
          showAddToCart: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ProductCategories",
        props: {
          id: generateId(),
          title: "Shop by Category",
          columns: 3,
          categories: [
            { name: "Clothing", image: "/categories/clothing.jpg", link: "#" },
            { name: "Accessories", image: "/categories/accessories.jpg", link: "#" },
            { name: "Footwear", image: "/categories/footwear.jpg", link: "#" },
          ],
          backgroundColor: "#fffbeb",
          padding: "lg",
        },
      },
      {
        type: "Newsletter",
        props: {
          id: generateId(),
          title: "Join Our Newsletter",
          subtitle: "Subscribe to get special offers, free giveaways, and new arrivals",
          placeholder: "Enter your email",
          buttonText: "Subscribe",
          backgroundColor: "#f59e0b",
          textColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "ShopBrand",
          description: "Your one-stop shop for quality products",
          columns: [
            {
              title: "Shop",
              links: [
                { label: "All Products", href: "#" },
                { label: "New Arrivals", href: "#" },
                { label: "Sale", href: "#" },
              ],
            },
            {
              title: "Help",
              links: [
                { label: "Shipping", href: "#" },
                { label: "Returns", href: "#" },
                { label: "FAQ", href: "#" },
              ],
            },
            {
              title: "Contact",
              links: [
                { label: "support@shop.com", href: "mailto:support@shop.com" },
                { label: "1-800-SHOP", href: "tel:1800" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            instagram: "#",
            facebook: "#",
            pinterest: "#",
          },
          copyrightText: "© 2026 ShopBrand. All rights reserved.",
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "20 minutes",
    difficulty: "beginner",
    componentCount: 6,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// BLOG STARTER TEMPLATE
// ============================================

export const blogStarterTemplate: PuckTemplate = {
  id: "blog-starter",
  name: "Blog Starter",
  slug: "blog-starter",
  description: "Clean blog layout for writers and content creators",
  category: "blog",
  subcategory: "starter",
  tags: ["blog", "content", "writing", "articles", "starter"],
  thumbnail: "/templates/blog-starter.svg",
  isPremium: false,
  isNew: false,
  isFeatured: false,
  isPopular: true,
  popularity: 82,
  features: ["Navigation", "Hero", "Recent posts grid", "Newsletter", "Footer"],
  sections: ["navbar", "hero", "blog", "newsletter", "footer"],
  componentsUsed: ["Navbar", "Hero", "Grid", "Card", "Newsletter", "Footer"],
  colorScheme: {
    primary: "#10b981",
    secondary: "#ecfdf5",
    accent: "#059669",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Blog" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "MyBlog",
          links: [
            { label: "Home", href: "#" },
            { label: "Articles", href: "#articles" },
            { label: "About", href: "#about" },
            { label: "Contact", href: "#contact" },
          ],
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Welcome to My Blog",
          subtitle: "Thoughts on design, technology, and life. Join me on this journey of discovery.",
          alignment: "center",
          buttonText: "Read Latest",
          buttonLink: "#articles",
          backgroundType: "gradient",
          gradientFrom: "#10b981",
          gradientTo: "#059669",
          textColor: "#ffffff",
          padding: "lg",
          showImage: false,
        },
      },
      {
        type: "Section",
        props: {
          id: generateId(),
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Newsletter",
        props: {
          id: generateId(),
          title: "Never Miss a Post",
          subtitle: "Get the latest articles delivered straight to your inbox",
          placeholder: "your@email.com",
          buttonText: "Subscribe",
          backgroundColor: "#ecfdf5",
          textColor: "#065f46",
          padding: "md",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "MyBlog",
          description: "Sharing ideas, one post at a time",
          columns: [
            {
              title: "Categories",
              links: [
                { label: "Design", href: "#" },
                { label: "Technology", href: "#" },
                { label: "Lifestyle", href: "#" },
              ],
            },
            {
              title: "Connect",
              links: [
                { label: "Twitter", href: "#" },
                { label: "LinkedIn", href: "#" },
                { label: "RSS Feed", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            twitter: "#",
            linkedin: "#",
            medium: "#",
          },
          copyrightText: "© 2026 MyBlog. All rights reserved.",
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "10 minutes",
    difficulty: "beginner",
    componentCount: 5,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// RESTAURANT STARTER TEMPLATE
// ============================================

export const restaurantStarterTemplate: PuckTemplate = {
  id: "restaurant-starter",
  name: "Restaurant Starter",
  slug: "restaurant-starter",
  description: "Appetizing restaurant website with menu showcase",
  category: "restaurant",
  subcategory: "starter",
  tags: ["restaurant", "food", "cafe", "menu", "starter"],
  thumbnail: "/templates/restaurant-starter.svg",
  isPremium: false,
  isNew: true,
  isFeatured: false,
  isPopular: true,
  popularity: 80,
  features: ["Navigation", "Hero", "Menu highlights", "About", "Location", "Contact"],
  sections: ["navbar", "hero", "features", "about", "map", "contact"],
  componentsUsed: ["Navbar", "Hero", "Features", "Section", "Map", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#dc2626",
    secondary: "#fef2f2",
    accent: "#b91c1c",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Restaurant" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "La Cuisine",
          links: [
            { label: "Home", href: "#" },
            { label: "Menu", href: "#menu" },
            { label: "About", href: "#about" },
            { label: "Location", href: "#location" },
          ],
          ctaText: "Reserve Table",
          ctaLink: "#reserve",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Exquisite Dining Experience",
          subtitle: "Authentic flavors crafted with passion and the finest ingredients",
          alignment: "center",
          buttonText: "View Menu",
          buttonLink: "#menu",
          secondaryButtonText: "Make Reservation",
          secondaryButtonLink: "#reserve",
          backgroundType: "image",
          backgroundImage: "/images/restaurant-hero.jpg",
          overlayOpacity: 0.5,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Our Specialties",
          subtitle: "Discover our chef's signature dishes",
          columns: 3,
          alignment: "center",
          features: [
            {
              icon: "🥗",
              title: "Fresh Ingredients",
              description: "Locally sourced and organic produce",
            },
            {
              icon: "👨‍🍳",
              title: "Expert Chefs",
              description: "Culinary masters with decades of experience",
            },
            {
              icon: "🍷",
              title: "Fine Wines",
              description: "Curated selection from around the world",
            },
          ],
          backgroundColor: "#fef2f2",
          padding: "lg",
        },
      },
      {
        type: "Map",
        props: {
          id: generateId(),
          title: "Find Us",
          address: "123 Gourmet Street, Food City",
          latitude: 40.7128,
          longitude: -74.006,
          zoom: 15,
          height: 400,
          showMarker: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "La Cuisine",
          description: "Where every meal is a celebration",
          columns: [
            {
              title: "Hours",
              links: [
                { label: "Mon-Thu: 5pm - 10pm", href: "#" },
                { label: "Fri-Sat: 5pm - 11pm", href: "#" },
                { label: "Sun: 4pm - 9pm", href: "#" },
              ],
            },
            {
              title: "Contact",
              links: [
                { label: "reservations@lacuisine.com", href: "mailto:reservations@lacuisine.com" },
                { label: "+260 966 123 456", href: "tel:+260966123456" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            instagram: "#",
            facebook: "#",
            yelp: "#",
          },
          copyrightText: "© 2026 La Cuisine. All rights reserved.",
          backgroundColor: "#1f2937",
          textColor: "#ffffff",
        },
      },
    ],
    zones: {},
  },
  metadata: {
    author: "DRAMAC",
    version: "1.0.0",
    createdAt: "2026-01-31",
    lastUpdated: "2026-01-31",
    estimatedBuildTime: "15 minutes",
    difficulty: "beginner",
    componentCount: 5,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// ALL STARTER TEMPLATES COLLECTION
// ============================================

export const STARTER_TEMPLATES: PuckTemplate[] = [
  blankTemplate,
  simpleLandingTemplate,
  businessStarterTemplate,
  portfolioStarterTemplate,
  ecommerceStarterTemplate,
  blogStarterTemplate,
  restaurantStarterTemplate,
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all starter templates
 */
export function getStarterTemplates(): PuckTemplate[] {
  return STARTER_TEMPLATES;
}

/**
 * Get a starter template by ID
 */
export function getStarterTemplateById(id: string): PuckTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get starter templates by category
 */
export function getStarterTemplatesByCategory(category: TemplateCategory): PuckTemplate[] {
  return STARTER_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get featured starter templates
 */
export function getFeaturedStarterTemplates(): PuckTemplate[] {
  return STARTER_TEMPLATES.filter((t) => t.isFeatured);
}

/**
 * Search starter templates
 */
export function searchStarterTemplates(query: string): PuckTemplate[] {
  const lowerQuery = query.toLowerCase();
  return STARTER_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

export default STARTER_TEMPLATES;
