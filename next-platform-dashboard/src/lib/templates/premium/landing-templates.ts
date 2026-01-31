/**
 * Premium Landing Page Templates
 * PHASE-ED-07B: Template System - Premium Templates
 * 
 * 8 premium landing page templates with full Puck component structures.
 */

import type { PuckTemplate } from "@/types/puck-templates";

function generateId(): string {
  return `component-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// 1. SAAS PRODUCT LAUNCH
// ============================================

export const saasProductLaunch: PuckTemplate = {
  id: "premium-saas-launch",
  name: "SaaS Product Launch",
  slug: "saas-product-launch",
  description: "High-converting SaaS product landing page with features, pricing, and testimonials",
  category: "landing",
  subcategory: "saas",
  tags: ["saas", "startup", "product", "launch", "conversion"],
  thumbnail: "/templates/premium/saas-launch.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: true,
  isPopular: true,
  popularity: 98,
  features: [
    "Animated hero section",
    "Feature comparison",
    "Pricing table",
    "Customer testimonials",
    "Integration showcase",
    "FAQ section",
    "Newsletter signup",
  ],
  sections: ["navbar", "hero", "features", "comparison", "pricing", "testimonials", "integrations", "faq", "cta", "footer"],
  componentsUsed: ["Navbar", "Hero", "Features", "FeatureComparison", "PricingTable", "TestimonialWall", "LogoCloud", "FAQ", "CTA", "Newsletter", "Footer"],
  colorScheme: {
    primary: "#6366f1",
    secondary: "#f1f5f9",
    accent: "#8b5cf6",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "SaaS Product Launch" } },
    content: [
      {
        type: "AnnouncementBar",
        props: {
          id: generateId(),
          text: "🎉 Launch Special: 50% off all plans for the first 100 customers",
          link: "#pricing",
          linkText: "Claim offer →",
          backgroundColor: "#6366f1",
          textColor: "#ffffff",
          dismissible: true,
        },
      },
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "ProductName",
          links: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "Testimonials", href: "#testimonials" },
            { label: "FAQ", href: "#faq" },
          ],
          ctaText: "Start Free Trial",
          ctaLink: "#",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "The All-in-One Platform for Modern Teams",
          subtitle: "Streamline your workflow, boost productivity, and scale your business with our powerful suite of tools. Trusted by 10,000+ companies worldwide.",
          alignment: "center",
          buttonText: "Start Free Trial",
          buttonLink: "#",
          secondaryButtonText: "Watch Demo",
          secondaryButtonLink: "#demo",
          backgroundType: "gradient",
          gradientFrom: "#6366f1",
          gradientTo: "#8b5cf6",
          textColor: "#ffffff",
          padding: "xl",
          showImage: true,
          imageUrl: "/images/dashboard-preview.png",
          imagePosition: "bottom",
        },
      },
      {
        type: "LogoCloud",
        props: {
          id: generateId(),
          title: "Trusted by industry leaders",
          logos: [
            { name: "Company 1", src: "/logos/logo1.svg" },
            { name: "Company 2", src: "/logos/logo2.svg" },
            { name: "Company 3", src: "/logos/logo3.svg" },
            { name: "Company 4", src: "/logos/logo4.svg" },
            { name: "Company 5", src: "/logos/logo5.svg" },
          ],
          grayscale: true,
          backgroundColor: "#f8fafc",
          padding: "md",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Everything you need to succeed",
          subtitle: "Powerful features designed to help your team work smarter",
          columns: 3,
          alignment: "center",
          features: [
            {
              icon: "⚡",
              title: "Lightning Fast",
              description: "Built on modern infrastructure for blazing-fast performance",
            },
            {
              icon: "🔒",
              title: "Enterprise Security",
              description: "SOC 2 compliant with end-to-end encryption",
            },
            {
              icon: "🔄",
              title: "Real-time Sync",
              description: "Collaborate seamlessly with instant updates",
            },
            {
              icon: "📊",
              title: "Advanced Analytics",
              description: "Gain insights with powerful reporting tools",
            },
            {
              icon: "🔗",
              title: "100+ Integrations",
              description: "Connect with your favorite tools",
            },
            {
              icon: "🎯",
              title: "Smart Automation",
              description: "Automate repetitive tasks and save time",
            },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "PricingTable",
        props: {
          id: generateId(),
          title: "Simple, transparent pricing",
          subtitle: "Choose the plan that fits your needs. All plans include a 14-day free trial.",
          plans: [
            {
              name: "Starter",
              price: 29,
              period: "month",
              description: "Perfect for small teams",
              features: ["Up to 5 team members", "Basic analytics", "Email support", "1GB storage"],
              buttonText: "Start Free Trial",
              highlighted: false,
            },
            {
              name: "Professional",
              price: 79,
              period: "month",
              description: "Best for growing businesses",
              features: ["Up to 25 team members", "Advanced analytics", "Priority support", "10GB storage", "API access", "Custom integrations"],
              buttonText: "Start Free Trial",
              highlighted: true,
              badge: "Most Popular",
            },
            {
              name: "Enterprise",
              price: 199,
              period: "month",
              description: "For large organizations",
              features: ["Unlimited team members", "Custom analytics", "24/7 phone support", "Unlimited storage", "API access", "Custom integrations", "Dedicated account manager", "SSO & SAML"],
              buttonText: "Contact Sales",
              highlighted: false,
            },
          ],
          backgroundColor: "#f1f5f9",
          padding: "lg",
        },
      },
      {
        type: "TestimonialWall",
        props: {
          id: generateId(),
          title: "Loved by thousands of customers",
          subtitle: "See what our customers have to say",
          testimonials: [
            {
              quote: "This platform has transformed how our team works. We've seen a 40% increase in productivity.",
              author: "Sarah Johnson",
              role: "CEO",
              company: "TechCorp",
              avatar: "/avatars/sarah.jpg",
              rating: 5,
            },
            {
              quote: "The best investment we've made for our business. The ROI has been incredible.",
              author: "Michael Chen",
              role: "CTO",
              company: "StartupXYZ",
              avatar: "/avatars/michael.jpg",
              rating: 5,
            },
            {
              quote: "Exceptional support and constant improvements. They really listen to their customers.",
              author: "Emily Davis",
              role: "Operations Manager",
              company: "GrowthCo",
              avatar: "/avatars/emily.jpg",
              rating: 5,
            },
          ],
          columns: 3,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "FAQ",
        props: {
          id: generateId(),
          title: "Frequently Asked Questions",
          subtitle: "Everything you need to know about our platform",
          items: [
            {
              question: "How does the free trial work?",
              answer: "Start with a 14-day free trial with full access to all features. No credit card required. Cancel anytime.",
            },
            {
              question: "Can I change my plan later?",
              answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
            },
            {
              question: "Is there a setup fee?",
              answer: "No, there are no setup fees. You only pay for your subscription plan.",
            },
            {
              question: "Do you offer refunds?",
              answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied.",
            },
          ],
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "CTA",
        props: {
          id: generateId(),
          title: "Ready to transform your workflow?",
          subtitle: "Join 10,000+ companies already using our platform",
          buttonText: "Start Your Free Trial",
          buttonLink: "#",
          buttonVariant: "default",
          alignment: "center",
          backgroundColor: "#6366f1",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "ProductName",
          description: "The all-in-one platform for modern teams",
          columns: [
            {
              title: "Product",
              links: [
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Integrations", href: "#" },
                { label: "Changelog", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Careers", href: "#" },
                { label: "Press", href: "#" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Documentation", href: "#" },
                { label: "Help Center", href: "#" },
                { label: "Community", href: "#" },
                { label: "Status", href: "#" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy", href: "#" },
                { label: "Terms", href: "#" },
                { label: "Security", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: {
            twitter: "#",
            linkedin: "#",
            github: "#",
          },
          copyrightText: "© 2026 ProductName. All rights reserved.",
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
    estimatedBuildTime: "25 minutes",
    difficulty: "intermediate",
    componentCount: 10,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 2. APP DOWNLOAD LANDING
// ============================================

export const appDownloadLanding: PuckTemplate = {
  id: "premium-app-download",
  name: "App Download",
  slug: "app-download",
  description: "Mobile app download landing page with app store badges and feature highlights",
  category: "landing",
  subcategory: "mobile",
  tags: ["app", "mobile", "download", "ios", "android"],
  thumbnail: "/templates/premium/app-download.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: true,
  isPopular: true,
  popularity: 94,
  features: [
    "App store badges",
    "Device mockups",
    "Feature carousel",
    "Screenshot gallery",
    "Download stats",
    "User reviews",
  ],
  sections: ["navbar", "hero", "features", "screenshots", "stats", "testimonials", "download", "footer"],
  componentsUsed: ["Navbar", "Hero", "Features", "Gallery", "Stats", "Testimonials", "CTA", "Footer"],
  colorScheme: {
    primary: "#10b981",
    secondary: "#ecfdf5",
    accent: "#059669",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "App Download" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "AppName",
          links: [
            { label: "Features", href: "#features" },
            { label: "Screenshots", href: "#screenshots" },
            { label: "Reviews", href: "#reviews" },
          ],
          ctaText: "Download Now",
          ctaLink: "#download",
          sticky: true,
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Your Life, Simplified",
          subtitle: "The app that helps you organize, plan, and achieve more every day. Download for free on iOS and Android.",
          alignment: "center",
          buttonText: "Download for iOS",
          buttonLink: "#",
          secondaryButtonText: "Get it on Android",
          secondaryButtonLink: "#",
          backgroundType: "gradient",
          gradientFrom: "#10b981",
          gradientTo: "#059669",
          textColor: "#ffffff",
          padding: "xl",
          showImage: true,
          imageUrl: "/images/phone-mockup.png",
        },
      },
      {
        type: "Stats",
        props: {
          id: generateId(),
          stats: [
            { value: "5M+", label: "Downloads" },
            { value: "4.9", label: "App Store Rating" },
            { value: "150+", label: "Countries" },
            { value: "99.9%", label: "Uptime" },
          ],
          columns: 4,
          backgroundColor: "#f8fafc",
          textColor: "#1f2937",
          padding: "md",
        },
      },
      {
        type: "Features",
        props: {
          id: generateId(),
          title: "Why You'll Love It",
          subtitle: "Powerful features in a beautiful, simple interface",
          columns: 3,
          alignment: "center",
          features: [
            { icon: "📱", title: "Intuitive Design", description: "Clean, beautiful interface that's easy to use" },
            { icon: "🔔", title: "Smart Notifications", description: "Never miss what matters with intelligent alerts" },
            { icon: "☁️", title: "Cloud Sync", description: "Access your data anywhere, on any device" },
            { icon: "🔐", title: "Privacy First", description: "Your data is encrypted and secure" },
            { icon: "⚡", title: "Lightning Fast", description: "Optimized for speed and performance" },
            { icon: "🎨", title: "Customizable", description: "Make it yours with themes and widgets" },
          ],
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Gallery",
        props: {
          id: generateId(),
          title: "See It in Action",
          subtitle: "Explore the app's beautiful interface",
          columns: 4,
          gap: "md",
          images: [
            { src: "/screenshots/screen1.jpg", alt: "Home Screen" },
            { src: "/screenshots/screen2.jpg", alt: "Dashboard" },
            { src: "/screenshots/screen3.jpg", alt: "Settings" },
            { src: "/screenshots/screen4.jpg", alt: "Profile" },
          ],
          enableLightbox: true,
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "Testimonials",
        props: {
          id: generateId(),
          title: "What Users Say",
          subtitle: "Join millions of satisfied users",
          testimonials: [
            {
              quote: "This app has completely changed how I manage my daily tasks. Can't imagine life without it!",
              author: "Alex Rivera",
              role: "Product Designer",
              avatar: "/avatars/alex.jpg",
            },
            {
              quote: "Finally an app that just works. Simple, fast, and reliable.",
              author: "Jordan Lee",
              role: "Entrepreneur",
              avatar: "/avatars/jordan.jpg",
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
          title: "Download Today",
          subtitle: "Available on iOS and Android • Free to download",
          buttonText: "Get the App",
          buttonLink: "#",
          alignment: "center",
          backgroundColor: "#10b981",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "AppName",
          description: "Your life, simplified",
          columns: [
            {
              title: "App",
              links: [
                { label: "Features", href: "#" },
                { label: "Pricing", href: "#" },
                { label: "Download", href: "#" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Help Center", href: "#" },
                { label: "Contact", href: "#" },
                { label: "FAQ", href: "#" },
              ],
            },
          ],
          showSocial: true,
          socialLinks: { twitter: "#", instagram: "#" },
          copyrightText: "© 2026 AppName. All rights reserved.",
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
    estimatedBuildTime: "20 minutes",
    difficulty: "beginner",
    componentCount: 8,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 3. COMING SOON / WAITLIST
// ============================================

export const comingSoonWaitlist: PuckTemplate = {
  id: "premium-coming-soon",
  name: "Coming Soon / Waitlist",
  slug: "coming-soon-waitlist",
  description: "Pre-launch landing page with countdown timer and email capture",
  category: "landing",
  subcategory: "prelaunch",
  tags: ["coming soon", "waitlist", "launch", "countdown", "prelaunch"],
  thumbnail: "/templates/premium/coming-soon.jpg",
  isPremium: true,
  isNew: false,
  isFeatured: false,
  isPopular: true,
  popularity: 88,
  features: [
    "Countdown timer",
    "Email capture",
    "Social sharing",
    "Animated background",
    "Progress indicator",
  ],
  sections: ["hero", "countdown", "newsletter", "social"],
  componentsUsed: ["Hero", "Countdown", "Newsletter", "SocialLinks", "AnimatedGradient"],
  colorScheme: {
    primary: "#8b5cf6",
    secondary: "#f5f3ff",
    accent: "#7c3aed",
    background: "#0f0f1a",
  },
  puckData: {
    root: { props: { title: "Coming Soon" } },
    content: [
      {
        type: "AnimatedGradient",
        props: {
          id: generateId(),
          colors: ["#8b5cf6", "#6366f1", "#7c3aed"],
          speed: "slow",
          fullScreen: true,
        },
      },
      {
        type: "Section",
        props: {
          id: generateId(),
          backgroundColor: "transparent",
          padding: "xl",
          minHeight: "100vh",
          centered: true,
        },
      },
      {
        type: "Heading",
        props: {
          id: generateId(),
          text: "Something Amazing is Coming",
          level: "h1",
          alignment: "center",
          color: "#ffffff",
          size: "4xl",
        },
      },
      {
        type: "Text",
        props: {
          id: generateId(),
          text: "We're working hard to bring you something incredible. Be the first to know when we launch.",
          alignment: "center",
          color: "#a5b4fc",
          size: "lg",
        },
      },
      {
        type: "Countdown",
        props: {
          id: generateId(),
          targetDate: "2026-03-01T00:00:00",
          style: "cards",
          showLabels: true,
          backgroundColor: "rgba(255,255,255,0.1)",
          textColor: "#ffffff",
        },
      },
      {
        type: "Newsletter",
        props: {
          id: generateId(),
          title: "Get Early Access",
          subtitle: "Join the waitlist and be first in line",
          placeholder: "Enter your email",
          buttonText: "Join Waitlist",
          backgroundColor: "transparent",
          textColor: "#ffffff",
          compact: true,
        },
      },
      {
        type: "SocialLinks",
        props: {
          id: generateId(),
          links: {
            twitter: "#",
            instagram: "#",
            linkedin: "#",
          },
          style: "icons",
          alignment: "center",
          color: "#ffffff",
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
    componentCount: 7,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// 4. WEBINAR REGISTRATION
// ============================================

export const webinarRegistration: PuckTemplate = {
  id: "premium-webinar",
  name: "Webinar Registration",
  slug: "webinar-registration",
  description: "High-converting webinar landing page with countdown and registration form",
  category: "landing",
  subcategory: "events",
  tags: ["webinar", "event", "registration", "lead capture", "conversion"],
  thumbnail: "/templates/premium/webinar.jpg",
  isPremium: true,
  isNew: true,
  isFeatured: false,
  isPopular: true,
  popularity: 86,
  features: [
    "Event countdown",
    "Speaker profiles",
    "Registration form",
    "Agenda preview",
    "Social proof",
  ],
  sections: ["navbar", "hero", "countdown", "speakers", "agenda", "registration", "footer"],
  componentsUsed: ["Navbar", "Hero", "Countdown", "Team", "Timeline", "ContactForm", "Footer"],
  colorScheme: {
    primary: "#f59e0b",
    secondary: "#fffbeb",
    accent: "#d97706",
    background: "#ffffff",
  },
  puckData: {
    root: { props: { title: "Webinar Registration" } },
    content: [
      {
        type: "Navbar",
        props: {
          id: generateId(),
          logo: "WebinarName",
          links: [
            { label: "Speakers", href: "#speakers" },
            { label: "Agenda", href: "#agenda" },
          ],
          ctaText: "Register Now",
          ctaLink: "#register",
          sticky: true,
          backgroundColor: "#ffffff",
        },
      },
      {
        type: "Hero",
        props: {
          id: generateId(),
          title: "Master Digital Marketing in 2026",
          subtitle: "Join industry experts for a free 2-hour masterclass on the latest marketing strategies and tools",
          alignment: "center",
          buttonText: "Reserve Your Spot",
          buttonLink: "#register",
          backgroundType: "gradient",
          gradientFrom: "#f59e0b",
          gradientTo: "#d97706",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Countdown",
        props: {
          id: generateId(),
          targetDate: "2026-02-15T14:00:00",
          title: "Event starts in:",
          style: "minimal",
          backgroundColor: "#fffbeb",
          textColor: "#92400e",
        },
      },
      {
        type: "Team",
        props: {
          id: generateId(),
          title: "Meet Your Speakers",
          subtitle: "Learn from industry leaders",
          members: [
            {
              name: "Dr. Sarah Chen",
              role: "CMO at TechCorp",
              bio: "20+ years in digital marketing",
              image: "/speakers/sarah.jpg",
            },
            {
              name: "James Wilson",
              role: "Founder, GrowthLab",
              bio: "Helped 500+ businesses scale",
              image: "/speakers/james.jpg",
            },
          ],
          columns: 2,
          backgroundColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Timeline",
        props: {
          id: generateId(),
          title: "Agenda",
          items: [
            { time: "2:00 PM", title: "Welcome & Introduction", description: "Setting the stage" },
            { time: "2:15 PM", title: "2026 Marketing Trends", description: "What's working now" },
            { time: "2:45 PM", title: "Live Q&A Session", description: "Your questions answered" },
            { time: "3:30 PM", title: "Exclusive Offers", description: "Special attendee bonuses" },
          ],
          backgroundColor: "#f8fafc",
          padding: "lg",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: generateId(),
          title: "Reserve Your Free Spot",
          subtitle: "Limited to 500 attendees",
          fields: [
            { name: "name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "company", label: "Company", type: "text", required: false },
          ],
          submitText: "Register Now - It's Free",
          backgroundColor: "#f59e0b",
          textColor: "#ffffff",
          padding: "lg",
        },
      },
      {
        type: "Footer",
        props: {
          id: generateId(),
          companyName: "WebinarName",
          copyrightText: "© 2026 WebinarName. All rights reserved.",
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
    componentCount: 7,
    responsive: true,
    darkModeReady: true,
  },
};

// ============================================
// ALL LANDING TEMPLATES
// ============================================

export const LANDING_TEMPLATES: PuckTemplate[] = [
  saasProductLaunch,
  appDownloadLanding,
  comingSoonWaitlist,
  webinarRegistration,
];

export default LANDING_TEMPLATES;
