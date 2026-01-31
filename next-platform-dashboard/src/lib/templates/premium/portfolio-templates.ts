/**
 * Premium Portfolio Templates
 * PHASE-ED-07B: Template System - Premium Templates
 * 
 * 6 premium portfolio templates with full Puck component structures.
 */

import type { PuckTemplate } from "@/types/puck-templates";

function generateId(): string {
  return `component-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// 1. CREATIVE AGENCY PORTFOLIO
// ============================================

export const creativeAgencyPortfolio: PuckTemplate = {
  id: "premium-creative-agency",
  name: "Creative Agency",
  slug: "creative-agency",
  description: "Bold creative agency portfolio showcasing work and team",
  category: "portfolio",
  subcategory: "agency",
  tags: ["agency", "creative", "design", "portfolio", "showcase"],
  thumbnail: "/templates/premium/creative-agency.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: true,
  isPopular: true,
  popularity: 96,
  features: [
    "Full-screen project gallery",
    "Client testimonials",
    "Service offerings",
    "Team showcase",
    "Contact form",
  ],
  sections: ["navbar", "hero", "work", "services", "about", "team", "testimonials", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Gallery", "Services", "About", "Team", "Testimonials", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#000000",
    secondary: "#f8f8f8",
    accent: "#ff6b35",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Creative Agency" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "STUDIO X",
          links: [
            { label: "Work", href: "#work" },
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
            { label: "Team", href: "#team" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Start a Project",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#000000",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "We Create Digital Experiences That Matter",
          subtitle: "Award-winning creative agency specializing in brand identity, digital design, and web development.",
          alignment: "left",
          buttonText: "View Our Work",
          buttonLink: "#work",
          backgroundType: "color",
          backgroundColor: "#000000",
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "Selected Work",
          subtitle: "Projects we're proud of",
          columns: 2,
          gap: "md",
          images: [
            { src: "/portfolio/project1.jpg", alt: "Brand Identity - TechFlow", title: "TechFlow", category: "Brand Identity" },
            { src: "/portfolio/project2.jpg", alt: "Web Design - Artisan Coffee", title: "Artisan Coffee", category: "Web Design" },
            { src: "/portfolio/project3.jpg", alt: "Digital Campaign - EcoLiving", title: "EcoLiving", category: "Digital Campaign" },
            { src: "/portfolio/project4.jpg", alt: "UI/UX - HealthApp", title: "HealthApp", category: "UI/UX Design" },
          ],
          enableLightbox: true,
          showCategories: true,
          backgroundColor: "#f8f8f8",
          padding: "lg",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "What We Do",
          services: [
            { icon: "🎨", title: "Brand Identity", description: "Creating memorable brands that stand out" },
            { icon: "💻", title: "Web Design & Development", description: "Beautiful, functional websites that convert" },
            { icon: "📱", title: "Digital Strategy", description: "Data-driven campaigns that deliver results" },
            { icon: "🎬", title: "Motion & Video", description: "Engaging video content and animations" },
          ],
          columns: 4,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "About",
        props: {
          id: generateId(),
          title: "About Studio X",
          content: "We're a team of designers, developers, and strategists who believe in the power of great design to transform businesses. Founded in 2015, we've helped over 200 brands tell their stories and connect with their audiences.",
          image: "/images/studio-about.jpg",
          imagePosition: "right",
          backgroundColor: "#f8f8f8",
          padding: "lg",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "The Team",
          members: [
            { name: "Sofia Rodriguez", role: "Creative Director", image: "/team/sofia.jpg" },
            { name: "Marcus Lee", role: "Design Lead", image: "/team/marcus.jpg" },
            { name: "Emma Watson", role: "Developer", image: "/team/emma.jpg" },
            { name: "James Chen", role: "Strategist", image: "/team/james.jpg" },
          ],
          columns: 4,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "What Clients Say",
          testimonials: [
            {
              quote: "Studio X transformed our brand completely. The results exceeded our expectations.",
              author: "Jennifer Adams",
              role: "CEO",
              company: "TechFlow",
            },
            {
              quote: "Creative, professional, and a joy to work with. Highly recommend!",
              author: "David Park",
              role: "Founder",
              company: "Artisan Coffee Co",
            },
          ],
          backgroundColor: "#000000",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Let's Work Together",
          subtitle: "Have a project in mind? We'd love to hear about it.",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "company", label: "Company", type: "text", required: false },
            { name: "budget", label: "Budget Range", type: "select", options: ["<$10k", "$10k-25k", "$25k-50k", "$50k+"], required: true },
            { name: "message", label: "Tell us about your project", type: "textarea", required: true },
          ],
          submitText: "Send Message",
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "STUDIO X",
          description: "Creative agency • Est. 2015",
          showSocial: true,
          socialLinks: { instagram: "#", dribbble: "#", behance: "#", twitter: "#" },
          copyrightText: "© 2026 Studio X. All rights reserved.",
          backgroundColor: "#000000",
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
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 9,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 2. PHOTOGRAPHY PORTFOLIO
// ============================================

export const photographyPortfolio: PuckTemplate = {
  id: "premium-photography",
  name: "Photography Portfolio",
  slug: "photography-portfolio",
  description: "Stunning photography portfolio with masonry gallery",
  category: "portfolio",
  subcategory: "photography",
  tags: ["photography", "portfolio", "gallery", "visual", "creative"],
  thumbnail: "/templates/premium/photography.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 93,
  features: [
    "Masonry gallery",
    "Category filtering",
    "Lightbox viewing",
    "About section",
    "Contact/booking",
  ],
  sections: ["navbar", "hero", "gallery", "about", "services", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "MasonryGallery", "About", "Services", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#171717",
    secondary: "#fafafa",
    accent: "#e5e5e5",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Photography Portfolio" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "JANE DOE",
          links: [
            { label: "Portfolio", href: "#portfolio" },
            { label: "About", href: "#about" },
            { label: "Services", href: "#services" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Book a Session",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#171717",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Capturing Moments That Last Forever",
          subtitle: "Professional photographer specializing in portraits, weddings, and lifestyle photography.",
          alignment: "center",
          buttonText: "View Portfolio",
          buttonLink: "#portfolio",
          backgroundType: "image",
          backgroundImage: "/images/photo-hero.jpg",
          overlay: true,
          overlayOpacity: 0.5,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "MasonryGallery",
        props: {
          id: generateId(),
          title: "Portfolio",
          columns: 3,
          gap: "sm",
          images: [
            { src: "/photos/portrait1.jpg", alt: "Portrait", category: "Portraits" },
            { src: "/photos/wedding1.jpg", alt: "Wedding", category: "Weddings" },
            { src: "/photos/lifestyle1.jpg", alt: "Lifestyle", category: "Lifestyle" },
            { src: "/photos/portrait2.jpg", alt: "Portrait", category: "Portraits" },
            { src: "/photos/wedding2.jpg", alt: "Wedding", category: "Weddings" },
            { src: "/photos/lifestyle2.jpg", alt: "Lifestyle", category: "Lifestyle" },
            { src: "/photos/portrait3.jpg", alt: "Portrait", category: "Portraits" },
            { src: "/photos/wedding3.jpg", alt: "Wedding", category: "Weddings" },
          ],
          enableLightbox: true,
          showFilter: true,
          filterCategories: ["All", "Portraits", "Weddings", "Lifestyle"],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "About",
        props: {
          id: generateId(),
          title: "Hello, I'm Jane",
          content: "I've been capturing beautiful moments for over 10 years. My passion lies in telling stories through images – whether it's the joy of a wedding day, the personality in a portrait, or the authenticity of everyday life. Every photo session is an opportunity to create art together.",
          image: "/images/jane-portrait.jpg",
          imagePosition: "left",
          backgroundColor: "#fafafa",
          padding: "lg",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "Services & Pricing",
          services: [
            { icon: "📸", title: "Portrait Session", description: "1-hour session, 20 edited photos", price: "From $350" },
            { icon: "💒", title: "Wedding Photography", description: "Full day coverage, unlimited photos", price: "From $3,000" },
            { icon: "👨‍👩‍👧", title: "Family & Lifestyle", description: "On-location session, 30 edited photos", price: "From $500" },
            { icon: "🏢", title: "Commercial", description: "Product, headshots, branding", price: "Custom Quote" },
          ],
          columns: 4,
          showPrice: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Book Your Session",
          subtitle: "Let's create something beautiful together",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel", required: true },
            { name: "service", label: "Service Type", type: "select", options: ["Portrait", "Wedding", "Family", "Commercial", "Other"], required: true },
            { name: "date", label: "Preferred Date", type: "date", required: false },
            { name: "message", label: "Tell me about your vision", type: "textarea", required: true },
          ],
          submitText: "Send Inquiry",
          backgroundColor: "#171717",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "JANE DOE PHOTOGRAPHY",
          showSocial: true,
          socialLinks: { instagram: "#", pinterest: "#" },
          copyrightText: "© 2026 Jane Doe Photography. All rights reserved.",
          backgroundColor: "#ffffff",
          textColor: "#171717",
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
    estimatedBuildTime: "25 minutes",
    difficulty: "beginner",
    componentCount: 7,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 3. DEVELOPER PORTFOLIO
// ============================================

export const developerPortfolio: PuckTemplate = {
  id: "premium-developer",
  name: "Developer Portfolio",
  slug: "developer-portfolio",
  description: "Modern developer portfolio with projects and skills showcase",
  category: "portfolio",
  subcategory: "developer",
  tags: ["developer", "programmer", "tech", "portfolio", "projects"],
  thumbnail: "/templates/premium/developer.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: true,
  isPopular: true,
  popularity: 97,
  features: [
    "Project showcase",
    "Skills/tech stack",
    "GitHub integration",
    "Blog section",
    "Contact form",
  ],
  sections: ["navbar", "hero", "projects", "skills", "experience", "blog", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "ProjectGrid", "Skills", "Timeline", "Blog", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#3b82f6",
    secondary: "#eff6ff",
    accent: "#1d4ed8",
    background: "#0f172a",
  },
  puckData: {
    root: { props: { title: "Developer Portfolio" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "<JD />",
          links: [
            { label: "Projects", href: "#projects" },
            { label: "Skills", href: "#skills" },
            { label: "Experience", href: "#experience" },
            { label: "Blog", href: "#blog" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Hire Me",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Full-Stack Developer",
          subtitle: "I build exceptional digital experiences. Specializing in React, Node.js, and cloud architecture. Let's create something amazing together.",
          alignment: "left",
          buttonText: "View Projects",
          buttonLink: "#projects",
          secondaryButtonText: "Download Resume",
          secondaryButtonLink: "#",
          backgroundType: "animated",
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
          padding: "xl",
          showCode: true,
          codeSnippet: "const developer = {\n  name: 'John Doe',\n  skills: ['React', 'Node.js', 'TypeScript'],\n  passion: 'Building great products'\n};",
        },
      },
      {
        type: "ProjectGrid",
        props: {
          id: generateId(),
          title: "Featured Projects",
          subtitle: "Some of my recent work",
          projects: [
            {
              title: "E-Commerce Platform",
              description: "Full-stack e-commerce solution with React and Node.js",
              image: "/projects/ecommerce.jpg",
              tags: ["React", "Node.js", "MongoDB", "Stripe"],
              liveUrl: "#",
              githubUrl: "#",
            },
            {
              title: "AI Chat Application",
              description: "Real-time chat app with AI-powered responses",
              image: "/projects/chat-ai.jpg",
              tags: ["Next.js", "OpenAI", "WebSocket", "PostgreSQL"],
              liveUrl: "#",
              githubUrl: "#",
            },
            {
              title: "Task Management System",
              description: "Collaborative project management tool",
              image: "/projects/task-mgmt.jpg",
              tags: ["TypeScript", "React", "GraphQL", "AWS"],
              liveUrl: "#",
              githubUrl: "#",
            },
          ],
          columns: 3,
          showTags: true,
          showLinks: true,
          backgroundColor: "#1e293b",
          padding: "lg",
        },
      },
      {
        type: "Skills",
        props: {
          id: generateId(),
          title: "Tech Stack",
          subtitle: "Technologies I work with",
          skills: [
            { name: "JavaScript/TypeScript", level: 95, category: "Languages" },
            { name: "React/Next.js", level: 95, category: "Frontend" },
            { name: "Node.js", level: 90, category: "Backend" },
            { name: "Python", level: 80, category: "Languages" },
            { name: "PostgreSQL/MongoDB", level: 85, category: "Database" },
            { name: "AWS/GCP", level: 80, category: "Cloud" },
            { name: "Docker/K8s", level: 75, category: "DevOps" },
            { name: "GraphQL/REST", level: 90, category: "API" },
          ],
          showLevels: true,
          showCategories: true,
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Timeline",
        props: {
          id: generateId(),
          title: "Experience",
          items: [
            {
              date: "2023 - Present",
              title: "Senior Full-Stack Developer",
              company: "TechCorp Inc.",
              description: "Leading development of core platform features",
            },
            {
              date: "2020 - 2023",
              title: "Full-Stack Developer",
              company: "StartupXYZ",
              description: "Built scalable microservices architecture",
            },
            {
              date: "2018 - 2020",
              title: "Frontend Developer",
              company: "DigitalAgency",
              description: "Developed responsive web applications",
            },
          ],
          style: "alternating",
          backgroundColor: "#1e293b",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Blog",
        props: {
          id: generateId(),
          title: "Latest Articles",
          posts: [
            {
              title: "Building Scalable APIs with Node.js",
              excerpt: "Best practices for API design...",
              date: "Jan 20, 2026",
              link: "#",
            },
            {
              title: "React Performance Optimization Tips",
              excerpt: "Improve your React app performance...",
              date: "Jan 10, 2026",
              link: "#",
            },
          ],
          columns: 2,
          backgroundColor: "#0f172a",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Let's Connect",
          subtitle: "Have a project in mind? Let's talk!",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "subject", label: "Subject", type: "text", required: true },
            { name: "message", label: "Message", type: "textarea", required: true },
          ],
          submitText: "Send Message",
          backgroundColor: "#3b82f6",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "John Doe",
          showSocial: true,
          socialLinks: { github: "#", linkedin: "#", twitter: "#" },
          copyrightText: "© 2026 John Doe. Built with Next.js",
          backgroundColor: "#0f172a",
          textColor: "#94a3b8",
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
    estimatedBuildTime: "25 minutes",
    difficulty: "intermediate",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 4. ARTIST/ILLUSTRATOR PORTFOLIO
// ============================================

export const artistPortfolio: PuckTemplate = {
  id: "premium-artist",
  name: "Artist / Illustrator",
  slug: "artist-portfolio",
  description: "Vibrant portfolio for artists and illustrators",
  category: "portfolio",
  subcategory: "art",
  tags: ["artist", "illustrator", "creative", "gallery", "art"],
  thumbnail: "/templates/premium/artist.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: false,
  isPopular: true,
  popularity: 88,
  features: [
    "Art gallery",
    "Process showcase",
    "Commission info",
    "Shop integration",
    "Contact form",
  ],
  sections: ["navbar", "hero", "gallery", "about", "process", "commissions", "shop", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Gallery", "About", "Process", "Pricing", "ProductGrid", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#ec4899",
    secondary: "#fdf2f8",
    accent: "#f472b6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Artist Portfolio" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "✨ ArtistName",
          links: [
            { label: "Gallery", href: "#gallery" },
            { label: "About", href: "#about" },
            { label: "Commissions", href: "#commissions" },
            { label: "Shop", href: "#shop" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Commission Me",
          ctaLink: "#commissions",
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Bringing Imagination to Life",
          subtitle: "Freelance illustrator & digital artist creating whimsical, colorful artwork for books, games, and brands.",
          alignment: "center",
          buttonText: "View My Work",
          buttonLink: "#gallery",
          backgroundType: "gradient",
          gradientFrom: "#ec4899",
          gradientTo: "#8b5cf6",
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "Gallery",
          columns: 3,
          gap: "md",
          images: [
            { src: "/art/piece1.jpg", alt: "Fantasy Character", title: "Fantasy Character" },
            { src: "/art/piece2.jpg", alt: "Book Cover", title: "Book Cover" },
            { src: "/art/piece3.jpg", alt: "Game Asset", title: "Game Asset" },
            { src: "/art/piece4.jpg", alt: "Portrait", title: "Portrait Commission" },
            { src: "/art/piece5.jpg", alt: "Landscape", title: "Fantasy Landscape" },
            { src: "/art/piece6.jpg", alt: "Character Design", title: "Character Design" },
          ],
          enableLightbox: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "About",
        props: {
          id: generateId(),
          title: "About Me",
          content: "Hi! I'm a self-taught digital artist with a passion for creating vibrant, story-driven illustrations. I specialize in character design, book illustrations, and game art. When I'm not drawing, you can find me playing video games or exploring nature for inspiration.",
          image: "/images/artist-about.jpg",
          imagePosition: "left",
          backgroundColor: "#fdf2f8",
          padding: "lg",
        },
      },
      {
        type: "Pricing",
        props: {
          id: generateId(),
          title: "Commission Pricing",
          subtitle: "Turn your ideas into art",
          tiers: [
            {
              name: "Icon/Bust",
              price: 50,
              description: "Character from chest up",
              features: ["Simple background", "2 revisions", "5-7 days"],
            },
            {
              name: "Half Body",
              price: 100,
              description: "Character from waist up",
              features: ["Basic background", "3 revisions", "7-10 days"],
              highlighted: true,
            },
            {
              name: "Full Body",
              price: 200,
              description: "Complete character illustration",
              features: ["Detailed background", "5 revisions", "14-21 days"],
            },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ProductGrid",
        props: {
          id: generateId(),
          title: "Shop",
          subtitle: "Art prints, stickers, and more",
          products: [
            { name: "Fantasy Print A3", price: 25, image: "/shop/print1.jpg", link: "#" },
            { name: "Sticker Pack", price: 10, image: "/shop/stickers.jpg", link: "#" },
            { name: "Art Book", price: 45, image: "/shop/artbook.jpg", link: "#" },
          ],
          columns: 3,
          backgroundColor: "#fdf2f8",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Get in Touch",
          subtitle: "Questions? Commission requests? Say hello!",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "type", label: "Inquiry Type", type: "select", options: ["Commission", "Collaboration", "General"], required: true },
            { name: "message", label: "Message", type: "textarea", required: true },
          ],
          submitText: "Send Message",
          backgroundColor: "#ec4899",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "ArtistName",
          showSocial: true,
          socialLinks: { instagram: "#", twitter: "#", artstation: "#" },
          copyrightText: "© 2026 ArtistName. All art belongs to respective owners.",
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
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
    estimatedBuildTime: "25 minutes",
    difficulty: "beginner",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// ALL PORTFOLIO TEMPLATES
// ============================================

export const PORTFOLIO_TEMPLATES: PuckTemplate[] = [
  creativeAgencyPortfolio,
  photographyPortfolio,
  developerPortfolio,
  artistPortfolio,
];

export default PORTFOLIO_TEMPLATES;
