/**
 * Premium Business Templates
 * PHASE-ED-07B: Template System - Premium Templates
 * 
 * 8 premium business templates with full Puck component structures.
 */

import type { PuckTemplate } from "@/types/puck-templates";
import { generateComponentId as generateId } from "@/lib/utils/generate-id";

// ============================================
// 1. CORPORATE ENTERPRISE
// ============================================

export const corporateEnterprise: PuckTemplate = {
  id: "premium-corporate",
  name: "Corporate Enterprise",
  slug: "corporate-enterprise",
  description: "Professional corporate website for large enterprises and organizations",
  category: "business",
  subcategory: "corporate",
  tags: ["corporate", "enterprise", "professional", "b2b", "company"],
  thumbnail: "/templates/premium/corporate.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 95,
  features: [
    "Executive team profiles",
    "Company timeline",
    "Service offerings",
    "Case studies",
    "Contact sections",
    "News/Press area",
  ],
  sections: ["navbar", "hero", "services", "about", "team", "testimonials", "news", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Services", "About", "Team", "Testimonials", "Blog", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#1e40af",
    secondary: "#dbeafe",
    accent: "#3b82f6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Corporate Enterprise" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "ENTERPRISE",
          links: [
            { label: "About", href: "#about" },
            { label: "Services", href: "#services" },
            { label: "Team", href: "#team" },
            { label: "News", href: "#news" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Get in Touch",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1e40af",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Building Tomorrow's Solutions Today",
          subtitle: "A global leader in enterprise technology solutions. Transforming businesses through innovation for over 25 years.",
          alignment: "left",
          buttonText: "Explore Our Solutions",
          buttonLink: "#services",
          secondaryButtonText: "Watch Video",
          secondaryButtonLink: "#",
          backgroundType: "image",
          backgroundImage: "/images/corporate-hero.jpg",
          overlay: true,
          overlayOpacity: 0.7,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Stats",
        props: {
          id: generateId(),
          stats: [
            { value: "25+", label: "Years of Excellence" },
            { value: "500+", label: "Enterprise Clients" },
            { value: "30", label: "Countries" },
            { value: "$2B+", label: "Revenue Generated" },
          ],
          columns: 4,
          backgroundColor: "#1e40af",
          textColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "Our Services",
          subtitle: "Comprehensive solutions tailored to your business needs",
          services: [
            {
              icon: "💼",
              title: "Strategy Consulting",
              description: "Transform your business with data-driven strategic guidance",
              link: "#",
            },
            {
              icon: "🔧",
              title: "Digital Transformation",
              description: "Modernize your operations with cutting-edge technology",
              link: "#",
            },
            {
              icon: "☁️",
              title: "Cloud Solutions",
              description: "Scale efficiently with enterprise-grade cloud infrastructure",
              link: "#",
            },
            {
              icon: "🛡️",
              title: "Cybersecurity",
              description: "Protect your assets with comprehensive security solutions",
              link: "#",
            },
          ],
          columns: 4,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "About",
        props: {
          id: generateId(),
          title: "About Our Company",
          content: "For over 25 years, we've been at the forefront of enterprise technology, helping Fortune 500 companies navigate digital transformation. Our team of 2,000+ experts delivers innovative solutions that drive measurable business outcomes.",
          image: "/images/about-corporate.jpg",
          imagePosition: "right",
          showValues: true,
          values: ["Innovation", "Integrity", "Excellence", "Collaboration"],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "Executive Leadership",
          subtitle: "Meet the team driving our vision",
          members: [
            { name: "Robert Mitchell", role: "CEO", image: "/team/ceo.jpg" },
            { name: "Dr. Jennifer Park", role: "CTO", image: "/team/cto.jpg" },
            { name: "Michael Torres", role: "CFO", image: "/team/cfo.jpg" },
            { name: "Amanda Collins", role: "COO", image: "/team/coo.jpg" },
          ],
          columns: 4,
          showBio: false,
          backgroundColor: "#f1f5f9",
          padding: "lg",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "What Our Clients Say",
          testimonials: [
            {
              quote: "They transformed our entire digital infrastructure, resulting in a 40% increase in operational efficiency.",
              author: "David Chen",
              role: "CIO",
              company: "Global Finance Corp",
            },
            {
              quote: "A true partner in our growth journey. Their expertise is unmatched.",
              author: "Sarah Anderson",
              role: "CEO",
              company: "TechVentures Inc",
            },
          ],
          backgroundColor: "#1e40af",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Blog",
        props: {
          id: generateId(),
          title: "Latest News & Insights",
          subtitle: "Stay informed with industry trends and company updates",
          posts: [
            {
              title: "Digital Transformation Trends for 2026",
              excerpt: "Key insights on emerging technologies...",
              image: "/blog/post1.jpg",
              date: "Jan 15, 2026",
              link: "#",
            },
            {
              title: "Enterprise Cloud Strategy Guide",
              excerpt: "Best practices for cloud adoption...",
              image: "/blog/post2.jpg",
              date: "Jan 10, 2026",
              link: "#",
            },
            {
              title: "Cybersecurity in the AI Era",
              excerpt: "Protecting your organization from new threats...",
              image: "/blog/post3.jpg",
              date: "Jan 5, 2026",
              link: "#",
            },
          ],
          columns: 3,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Get in Touch",
          subtitle: "Ready to transform your business? Let's talk.",
          fields: [
            { name: "name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Business Email", type: "email", required: true },
            { name: "company", label: "Company", type: "text", required: true },
            { name: "phone", label: "Phone", type: "tel", required: false },
            { name: "message", label: "How can we help?", type: "textarea", required: true },
          ],
          submitText: "Submit Inquiry",
          showMap: true,
          mapAddress: "123 Enterprise Way, New York, NY",
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "ENTERPRISE",
          description: "Global leader in enterprise technology solutions",
          columns: [
            {
              title: "Solutions",
              links: [
                { label: "Consulting", href: "#" },
                { label: "Digital Transformation", href: "#" },
                { label: "Cloud Services", href: "#" },
                { label: "Cybersecurity", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", href: "#" },
                { label: "Leadership", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Newsroom", href: "#" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Case Studies", href: "#" },
                { label: "Whitepapers", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Events", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: { twitter: "#", linkedin: "#", facebook: "#" },
          copyrightText: "© 2026 ENTERPRISE. All rights reserved.",
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
    estimatedBuildTime: "35 minutes",
    difficulty: "intermediate",
    componentCount: 10,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 2. LAW FIRM / LEGAL
// ============================================

export const lawFirmLegal: PuckTemplate = {
  id: "premium-law-firm",
  name: "Law Firm",
  slug: "law-firm",
  description: "Professional website for law firms and legal practices",
  category: "business",
  subcategory: "legal",
  tags: ["law", "legal", "attorney", "lawyer", "professional"],
  thumbnail: "/templates/premium/law-firm.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 91,
  features: [
    "Practice areas",
    "Attorney profiles",
    "Case results",
    "Client testimonials",
    "Consultation form",
  ],
  sections: ["navbar", "hero", "practice-areas", "attorneys", "results", "testimonials", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Services", "Team", "Stats", "Testimonials", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#1e3a5f",
    secondary: "#f0f4f8",
    accent: "#c9a227",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Law Firm" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "Morrison & Partners",
          links: [
            { label: "Practice Areas", href: "#practice" },
            { label: "Our Team", href: "#team" },
            { label: "Results", href: "#results" },
            { label: "Testimonials", href: "#testimonials" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Free Consultation",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1e3a5f",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Justice. Integrity. Results.",
          subtitle: "Award-winning attorneys with over 50 years of combined experience fighting for our clients' rights.",
          alignment: "left",
          buttonText: "Schedule Free Consultation",
          buttonLink: "#contact",
          backgroundType: "image",
          backgroundImage: "/images/law-hero.jpg",
          overlay: true,
          overlayColor: "#1e3a5f",
          overlayOpacity: 0.8,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "Practice Areas",
          subtitle: "Comprehensive legal representation across multiple disciplines",
          services: [
            { icon: "⚖️", title: "Personal Injury", description: "Fighting for fair compensation", link: "#" },
            { icon: "🏢", title: "Business Law", description: "Protecting your business interests", link: "#" },
            { icon: "👨‍👩‍👧‍👦", title: "Family Law", description: "Compassionate family legal support", link: "#" },
            { icon: "🏠", title: "Real Estate", description: "Property and real estate matters", link: "#" },
            { icon: "📋", title: "Estate Planning", description: "Secure your family's future", link: "#" },
            { icon: "🚗", title: "Auto Accidents", description: "Get the settlement you deserve", link: "#" },
          ],
          columns: 3,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "Stats",
        props: {
          id: generateId(),
          title: "Our Track Record",
          stats: [
            { value: "$500M+", label: "Recovered for Clients" },
            { value: "5,000+", label: "Cases Won" },
            { value: "50+", label: "Years Experience" },
            { value: "98%", label: "Success Rate" },
          ],
          columns: 4,
          backgroundColor: "#1e3a5f",
          textColor: "#ffffff",
          padding: "md",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "Our Attorneys",
          subtitle: "Experienced advocates dedicated to your case",
          members: [
            { name: "James Morrison", role: "Managing Partner", bio: "Personal Injury Specialist", image: "/team/james.jpg" },
            { name: "Elizabeth Chen", role: "Partner", bio: "Business Litigation Expert", image: "/team/elizabeth.jpg" },
            { name: "Robert Williams", role: "Senior Associate", bio: "Family Law Attorney", image: "/team/robert.jpg" },
          ],
          columns: 3,
          showBio: true,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "Client Testimonials",
          testimonials: [
            {
              quote: "They fought tirelessly for my case and secured a settlement beyond my expectations.",
              author: "Michael R.",
              role: "Personal Injury Client",
            },
            {
              quote: "Professional, compassionate, and incredibly effective. Highly recommended.",
              author: "Jennifer T.",
              role: "Family Law Client",
            },
          ],
          backgroundColor: "#f0f4f8",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Free Case Evaluation",
          subtitle: "Tell us about your situation. All consultations are confidential.",
          fields: [
            { name: "name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel", required: true },
            { name: "caseType", label: "Type of Case", type: "select", options: ["Personal Injury", "Business Law", "Family Law", "Real Estate", "Other"], required: true },
            { name: "message", label: "Describe Your Situation", type: "textarea", required: true },
          ],
          submitText: "Request Free Consultation",
          backgroundColor: "#1e3a5f",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "Morrison & Partners",
          description: "Award-winning legal representation",
          columns: [
            {
              title: "Practice Areas",
              links: [
                { label: "Personal Injury", href: "#" },
                { label: "Business Law", href: "#" },
                { label: "Family Law", href: "#" },
              ],
            },
            {
              title: "Contact",
              links: [
                { label: "(555) 123-4567", href: "tel:5551234567" },
                { label: "info@morrisonlaw.com", href: "mailto:info@morrisonlaw.com" },
                { label: "123 Legal Ave, Suite 500", href: "#" },
              ],
            },
          ],
          copyrightText: "© 2026 Morrison & Partners LLP. All rights reserved.",
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
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 3. CONSULTING AGENCY
// ============================================

export const consultingAgency: PuckTemplate = {
  id: "premium-consulting",
  name: "Consulting Agency",
  slug: "consulting-agency",
  description: "Professional consulting agency website with case studies and expertise showcase",
  category: "business",
  subcategory: "consulting",
  tags: ["consulting", "agency", "b2b", "professional", "services"],
  thumbnail: "/templates/premium/consulting.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: false,
  isPopular: true,
  popularity: 89,
  features: [
    "Service offerings",
    "Case studies carousel",
    "Team expertise",
    "Client logos",
    "Contact form",
  ],
  sections: ["navbar", "hero", "services", "case-studies", "process", "team", "clients", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Services", "Carousel", "Process", "Team", "LogoCloud", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#059669",
    secondary: "#ecfdf5",
    accent: "#10b981",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Consulting Agency" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "STRATEX",
          links: [
            { label: "Services", href: "#services" },
            { label: "Case Studies", href: "#cases" },
            { label: "Process", href: "#process" },
            { label: "Team", href: "#team" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Get Started",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Strategic Consulting for Growth",
          subtitle: "We help businesses scale through data-driven strategies and operational excellence.",
          alignment: "center",
          buttonText: "Book a Strategy Call",
          buttonLink: "#contact",
          backgroundType: "gradient",
          gradientFrom: "#059669",
          gradientTo: "#10b981",
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "LogoCloud",
        props: {
          id: generateId(),
          title: "Trusted by Leading Brands",
          logos: [
            { name: "Client 1", src: "/logos/client1.svg" },
            { name: "Client 2", src: "/logos/client2.svg" },
            { name: "Client 3", src: "/logos/client3.svg" },
            { name: "Client 4", src: "/logos/client4.svg" },
            { name: "Client 5", src: "/logos/client5.svg" },
          ],
          grayscale: true,
          backgroundColor: "#f8fafc",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "Our Expertise",
          subtitle: "Comprehensive consulting services tailored to your needs",
          services: [
            { icon: "📊", title: "Strategy Consulting", description: "Develop winning strategies for sustainable growth", link: "#" },
            { icon: "⚙️", title: "Operations", description: "Optimize processes and improve efficiency", link: "#" },
            { icon: "💻", title: "Digital Strategy", description: "Navigate digital transformation successfully", link: "#" },
            { icon: "📈", title: "Growth Advisory", description: "Accelerate your business growth", link: "#" },
          ],
          columns: 4,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Process",
        props: {
          id: generateId(),
          title: "Our Approach",
          subtitle: "A proven methodology that delivers results",
          steps: [
            { number: 1, title: "Discovery", description: "Deep dive into your business and challenges" },
            { number: 2, title: "Analysis", description: "Data-driven insights and opportunity mapping" },
            { number: 3, title: "Strategy", description: "Develop actionable roadmap for success" },
            { number: 4, title: "Execution", description: "Hands-on implementation support" },
          ],
          style: "horizontal",
          backgroundColor: "#ecfdf5",
          padding: "lg",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "Our Consultants",
          subtitle: "Industry experts ready to help",
          members: [
            { name: "Alexandra Reed", role: "Managing Director", image: "/team/alex.jpg" },
            { name: "Marcus Johnson", role: "Strategy Lead", image: "/team/marcus.jpg" },
            { name: "Priya Sharma", role: "Digital Practice", image: "/team/priya.jpg" },
          ],
          columns: 3,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Let's Talk Strategy",
          subtitle: "Schedule a free 30-minute consultation",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "company", label: "Company", type: "text", required: true },
            { name: "service", label: "Service Interest", type: "select", options: ["Strategy", "Operations", "Digital", "Growth"], required: true },
            { name: "message", label: "Tell us about your challenge", type: "textarea", required: true },
          ],
          submitText: "Schedule Consultation",
          backgroundColor: "#059669",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "STRATEX",
          description: "Strategic consulting for growth",
          copyrightText: "© 2026 STRATEX Consulting. All rights reserved.",
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
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 4. ACCOUNTING / FINANCE
// ============================================

export const accountingFinance: PuckTemplate = {
  id: "premium-accounting",
  name: "Accounting & Finance",
  slug: "accounting-finance",
  description: "Professional website for accounting firms and financial services",
  category: "business",
  subcategory: "finance",
  tags: ["accounting", "finance", "tax", "cpa", "bookkeeping"],
  thumbnail: "/templates/premium/accounting.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: false,
  isPopular: true,
  popularity: 85,
  features: [
    "Service categories",
    "Team credentials",
    "Client testimonials",
    "Resource center",
    "Appointment booking",
  ],
  sections: ["navbar", "hero", "services", "about", "team", "testimonials", "resources", "contact", "footer"],
  componentsUsed: ["Navbar", "Hero", "Services", "About", "Team", "Testimonials", "Blog", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#0f766e",
    secondary: "#f0fdfa",
    accent: "#14b8a6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Accounting & Finance" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "Sterling CPA",
          links: [
            { label: "Services", href: "#services" },
            { label: "About", href: "#about" },
            { label: "Team", href: "#team" },
            { label: "Resources", href: "#resources" },
            { label: "Contact", href: "#contact" },
          ],
          ctaText: "Free Consultation",
          ctaLink: "#contact",
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Financial Clarity for Your Business",
          subtitle: "Expert accounting, tax planning, and financial advisory services to help your business thrive.",
          alignment: "left",
          buttonText: "Schedule Consultation",
          buttonLink: "#contact",
          secondaryButtonText: "Our Services",
          secondaryButtonLink: "#services",
          backgroundType: "image",
          backgroundImage: "/images/finance-hero.jpg",
          overlay: true,
          textColor: "#ffffff",
          padding: "xl",
        },
      },
      {
        type: "Services",
        props: {
          id: generateId(),
          title: "Our Services",
          services: [
            { icon: "📊", title: "Tax Planning & Preparation", description: "Strategic tax planning for individuals and businesses" },
            { icon: "📚", title: "Bookkeeping", description: "Accurate and timely financial record keeping" },
            { icon: "💼", title: "Business Advisory", description: "Strategic guidance for business growth" },
            { icon: "📋", title: "Audit & Assurance", description: "Independent audit and review services" },
            { icon: "🏢", title: "Payroll Services", description: "Full-service payroll management" },
            { icon: "📈", title: "Financial Planning", description: "Personal and business financial planning" },
          ],
          columns: 3,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "About",
        props: {
          id: generateId(),
          title: "Why Choose Sterling CPA",
          content: "With over 30 years of combined experience, our team of certified public accountants provides personalized service and strategic financial guidance. We take the time to understand your unique needs and deliver solutions that help you achieve your goals.",
          image: "/images/about-accounting.jpg",
          imagePosition: "right",
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "Meet Our Team",
          members: [
            { name: "David Sterling", role: "CPA, Managing Partner", image: "/team/david.jpg" },
            { name: "Lisa Thompson", role: "CPA, Tax Director", image: "/team/lisa.jpg" },
            { name: "Kevin Park", role: "CPA, Audit Manager", image: "/team/kevin.jpg" },
          ],
          columns: 3,
          backgroundColor: "#f0fdfa",
          padding: "lg",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "Client Success Stories",
          testimonials: [
            {
              quote: "Sterling CPA has been invaluable in helping us navigate complex tax situations. Highly recommended.",
              author: "Robert M.",
              role: "Business Owner",
            },
            {
              quote: "Professional, responsive, and always looking out for our best interests.",
              author: "Amanda S.",
              role: "CFO, Tech Startup",
            },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Get in Touch",
          subtitle: "Schedule your free consultation today",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel", required: true },
            { name: "service", label: "Service Needed", type: "select", options: ["Tax Services", "Bookkeeping", "Business Advisory", "Audit", "Other"], required: true },
            { name: "message", label: "Additional Details", type: "textarea", required: false },
          ],
          submitText: "Request Consultation",
          backgroundColor: "#0f766e",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "Sterling CPA",
          description: "Your trusted financial partner",
          copyrightText: "© 2026 Sterling CPA. All rights reserved.",
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
    estimatedBuildTime: "30 minutes",
    difficulty: "intermediate",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// ALL BUSINESS TEMPLATES
// ============================================

export const BUSINESS_TEMPLATES: PuckTemplate[] = [
  corporateEnterprise,
  lawFirmLegal,
  consultingAgency,
  accountingFinance,
];

export default BUSINESS_TEMPLATES;
