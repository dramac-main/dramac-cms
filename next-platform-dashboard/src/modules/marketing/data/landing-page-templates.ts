/**
 * Marketing Module - Landing Page Templates
 *
 * Phase MKT-06: Landing Pages & Opt-In Forms
 * 8 pre-built landing page templates
 */

import type { LandingPageTemplate, LandingPageBlock } from "../types";
import { v4 as uuidv4 } from "uuid";

function block(
  type: LandingPageBlock["type"],
  content: Record<string, unknown>,
  order: number,
): LandingPageBlock {
  return { id: uuidv4(), type, content, order };
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: "lead-magnet",
    name: "Lead Magnet Download",
    description:
      "Capture leads by offering a downloadable resource like a PDF, checklist, or guide.",
    category: "Lead Generation",
    thumbnail: "/images/templates/lead-magnet.png",
    defaultSeo: {
      metaTitle: "Download Your Free Resource",
      metaDescription:
        "Get instant access to our free resource. Enter your email to download now.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Download Your Free Guide",
          subheading:
            "Learn the strategies that top professionals use to succeed.",
          buttonText: "Get Instant Access",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "features",
        {
          heading: "What You'll Learn",
          items: [
            {
              icon: "check",
              title: "Strategy 1",
              description: "Master the fundamentals that drive real results.",
            },
            {
              icon: "check",
              title: "Strategy 2",
              description: "Advanced techniques used by industry leaders.",
            },
            {
              icon: "check",
              title: "Strategy 3",
              description: "Actionable steps you can implement today.",
            },
          ],
        },
        1,
      ),
      block(
        "social_proof",
        {
          heading: "Trusted by Thousands",
          stats: [
            { value: "10,000+", label: "Downloads" },
            { value: "4.9/5", label: "Rating" },
            { value: "50+", label: "Pages" },
          ],
        },
        2,
      ),
      block(
        "optin_form",
        {
          heading: "Get Your Free Copy",
          description:
            "Enter your details below and we'll send it straight to your inbox.",
          buttonText: "Download Now",
          fields: ["email", "first_name"],
        },
        3,
      ),
    ],
  },
  {
    id: "webinar",
    name: "Webinar Registration",
    description: "Drive registrations for your upcoming webinar or live event.",
    category: "Events",
    thumbnail: "/images/templates/webinar.png",
    defaultSeo: {
      metaTitle: "Register for Our Free Webinar",
      metaDescription:
        "Join our upcoming webinar and learn from industry experts. Limited spots available.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Free Live Webinar",
          subheading: "Join us for an exclusive session with industry experts.",
          buttonText: "Reserve Your Spot",
          buttonAction: "scroll_to_form",
          backgroundStyle: "image",
        },
        0,
      ),
      block(
        "countdown",
        {
          heading: "Starts In",
          targetDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          style: "cards",
        },
        1,
      ),
      block(
        "features",
        {
          heading: "What You'll Discover",
          items: [
            {
              icon: "lightbulb",
              title: "Expert Insights",
              description: "Learn from leaders with 10+ years of experience.",
            },
            {
              icon: "users",
              title: "Live Q&A",
              description: "Get your questions answered in real-time.",
            },
            {
              icon: "gift",
              title: "Bonus Resources",
              description: "Receive exclusive materials after the session.",
            },
          ],
        },
        2,
      ),
      block(
        "testimonials",
        {
          heading: "What Past Attendees Say",
          items: [
            {
              name: "Sarah M.",
              role: "Marketing Director",
              quote: "This webinar completely changed how I approach strategy.",
            },
            {
              name: "James P.",
              role: "Business Owner",
              quote: "Practical advice I could implement immediately.",
            },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Register Now — Free",
          description:
            "Secure your seat. We'll send you the access link via email.",
          buttonText: "Register for Free",
          fields: ["email", "first_name", "last_name"],
        },
        4,
      ),
    ],
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description:
      "Announce and promote a new product with a high-impact landing page.",
    category: "Product",
    thumbnail: "/images/templates/product-launch.png",
    defaultSeo: {
      metaTitle: "Introducing Our Latest Product",
      metaDescription:
        "Be the first to experience our newest product. Sign up for early access.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Introducing Something Amazing",
          subheading: "The product you've been waiting for is finally here.",
          buttonText: "Get Early Access",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "video",
        {
          heading: "See It In Action",
          videoUrl: "",
          videoType: "youtube",
        },
        1,
      ),
      block(
        "features",
        {
          heading: "Key Features",
          layout: "grid",
          items: [
            {
              icon: "zap",
              title: "Lightning Fast",
              description: "Experience unmatched speed and performance.",
            },
            {
              icon: "shield",
              title: "Secure",
              description: "Enterprise-grade security built in.",
            },
            {
              icon: "refresh",
              title: "Automatic Updates",
              description: "Always stay up to date.",
            },
            {
              icon: "globe",
              title: "Works Everywhere",
              description: "Use on any device, anywhere.",
            },
          ],
        },
        2,
      ),
      block(
        "pricing",
        {
          heading: "Simple, Transparent Pricing",
          plans: [
            {
              name: "Starter",
              price: "Free",
              features: ["Basic features", "Community support"],
            },
            {
              name: "Pro",
              price: "$29/mo",
              features: [
                "All features",
                "Priority support",
                "Advanced analytics",
              ],
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              features: [
                "Everything in Pro",
                "Dedicated account manager",
                "Custom integrations",
              ],
            },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Get Early Access",
          description: "Be among the first to try it. Enter your email below.",
          buttonText: "Join the Waitlist",
          fields: ["email"],
        },
        4,
      ),
    ],
  },
  {
    id: "coming-soon",
    name: "Coming Soon",
    description:
      "Build anticipation with a pre-launch page that captures emails.",
    category: "Pre-Launch",
    thumbnail: "/images/templates/coming-soon.png",
    defaultSeo: {
      metaTitle: "Coming Soon — Stay Tuned",
      metaDescription:
        "Something exciting is on the way. Sign up to be the first to know.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Something Big Is Coming",
          subheading:
            "We're working on something exciting. Be the first to know when we launch.",
          buttonText: "Notify Me",
          buttonAction: "scroll_to_form",
          backgroundStyle: "dark",
        },
        0,
      ),
      block(
        "countdown",
        {
          heading: "Launching In",
          targetDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          style: "minimal",
        },
        1,
      ),
      block(
        "optin_form",
        {
          heading: "Get Notified",
          description:
            "Drop your email and we'll let you know the moment we go live.",
          buttonText: "Notify Me",
          fields: ["email"],
        },
        2,
      ),
    ],
  },
  {
    id: "sale-promo",
    name: "Sale / Promotion",
    description: "Promote a sale or special offer with urgency-driven design.",
    category: "Promotions",
    thumbnail: "/images/templates/sale-promo.png",
    defaultSeo: {
      metaTitle: "Limited Time Offer — Don't Miss Out",
      metaDescription:
        "Special promotion available for a limited time. Grab your discount before it's gone.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Massive Sale — Up to 50% Off",
          subheading:
            "For a limited time only. Don't miss these incredible deals.",
          buttonText: "Shop Now",
          buttonAction: "scroll_to_form",
          backgroundStyle: "bold",
        },
        0,
      ),
      block(
        "countdown",
        {
          heading: "Sale Ends In",
          targetDate: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          style: "urgent",
        },
        1,
      ),
      block(
        "gallery",
        {
          heading: "Featured Products",
          items: [
            {
              image: "",
              title: "Product 1",
              originalPrice: "$99",
              salePrice: "$49",
            },
            {
              image: "",
              title: "Product 2",
              originalPrice: "$149",
              salePrice: "$89",
            },
            {
              image: "",
              title: "Product 3",
              originalPrice: "$79",
              salePrice: "$39",
            },
          ],
        },
        2,
      ),
      block(
        "cta",
        {
          heading: "Don't Wait — This Won't Last",
          buttonText: "Claim Your Discount",
          buttonAction: "scroll_to_form",
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Get Your Exclusive Discount Code",
          description:
            "Enter your email to receive your personal discount code.",
          buttonText: "Get My Discount",
          fields: ["email"],
        },
        4,
      ),
    ],
  },
  {
    id: "ebook-download",
    name: "E-Book Download",
    description:
      "Promote and distribute an e-book or whitepaper to capture qualified leads.",
    category: "Lead Generation",
    thumbnail: "/images/templates/ebook-download.png",
    defaultSeo: {
      metaTitle: "Download Our Free E-Book",
      metaDescription:
        "Get our comprehensive e-book covering everything you need to know. Free download.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "The Ultimate Guide to Success",
          subheading:
            "200+ pages of expert knowledge, case studies, and actionable frameworks.",
          buttonText: "Download Free E-Book",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "image",
        {
          src: "",
          alt: "E-Book Cover",
          caption: "Available in PDF, ePub, and Kindle formats",
        },
        1,
      ),
      block(
        "features",
        {
          heading: "Inside This E-Book",
          items: [
            {
              icon: "book",
              title: "12 Chapters",
              description:
                "Comprehensive coverage from basics to advanced topics.",
            },
            {
              icon: "bar-chart",
              title: "50+ Case Studies",
              description: "Real-world examples from successful companies.",
            },
            {
              icon: "clipboard",
              title: "Actionable Templates",
              description: "Ready-to-use templates and worksheets.",
            },
          ],
        },
        2,
      ),
      block(
        "testimonials",
        {
          heading: "Reader Reviews",
          items: [
            {
              name: "Emily R.",
              role: "CEO",
              quote:
                "The best resource I've read this year. Highly recommended.",
            },
            {
              name: "Mark T.",
              role: "Consultant",
              quote:
                "Packed with insights I immediately applied to my business.",
            },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Download Your Free Copy",
          description: "Enter your email and we'll send it right over.",
          buttonText: "Send Me the E-Book",
          fields: ["email", "first_name"],
        },
        4,
      ),
    ],
  },
  {
    id: "free-trial",
    name: "Free Trial Signup",
    description:
      "Drive signups for a free trial of your SaaS product or service.",
    category: "SaaS",
    thumbnail: "/images/templates/free-trial.png",
    defaultSeo: {
      metaTitle: "Start Your Free Trial Today",
      metaDescription:
        "Try our platform free for 14 days. No credit card required.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Start Your Free 14-Day Trial",
          subheading:
            "No credit card required. Cancel anytime. Full access to all features.",
          buttonText: "Start Free Trial",
          buttonAction: "scroll_to_form",
          backgroundStyle: "clean",
        },
        0,
      ),
      block(
        "features",
        {
          heading: "Everything You Need",
          layout: "grid",
          items: [
            {
              icon: "dashboard",
              title: "Powerful Dashboard",
              description: "All your data in one place.",
            },
            {
              icon: "automation",
              title: "Smart Automation",
              description: "Save hours of manual work.",
            },
            {
              icon: "analytics",
              title: "Deep Analytics",
              description: "Insights that drive growth.",
            },
            {
              icon: "integrations",
              title: "100+ Integrations",
              description: "Connect your favorite tools.",
            },
          ],
        },
        1,
      ),
      block(
        "social_proof",
        {
          heading: "Trusted by Growing Businesses",
          logos: [],
          stats: [
            { value: "5,000+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ],
        },
        2,
      ),
      block(
        "faq",
        {
          heading: "Frequently Asked Questions",
          items: [
            {
              question: "Is the trial really free?",
              answer: "Yes, 100% free for 14 days. No credit card needed.",
            },
            {
              question: "Can I cancel anytime?",
              answer: "Absolutely. No contracts, no commitments.",
            },
            {
              question: "What happens after the trial?",
              answer:
                "Choose a plan that works for you, or your account stays on a free tier.",
            },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Start Your Free Trial",
          description: "Enter your details to get started in seconds.",
          buttonText: "Start Free Trial",
          fields: ["email", "first_name", "last_name"],
        },
        4,
      ),
    ],
  },
  {
    id: "consultation",
    name: "Book a Consultation",
    description:
      "Generate qualified leads by offering a free strategy session or demo.",
    category: "Services",
    thumbnail: "/images/templates/consultation.png",
    defaultSeo: {
      metaTitle: "Book Your Free Consultation",
      metaDescription:
        "Schedule a free strategy session with our experts. Limited availability.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Book Your Free Strategy Session",
          subheading:
            "30 minutes with our experts could transform your business. Limited spots available.",
          buttonText: "Book Now",
          buttonAction: "scroll_to_form",
          backgroundStyle: "professional",
        },
        0,
      ),
      block(
        "features",
        {
          heading: "What We'll Cover",
          items: [
            {
              icon: "search",
              title: "Business Assessment",
              description:
                "We'll analyze your current situation and identify opportunities.",
            },
            {
              icon: "map",
              title: "Custom Strategy",
              description: "Get a tailored roadmap specific to your goals.",
            },
            {
              icon: "rocket",
              title: "Action Plan",
              description: "Walk away with clear, actionable next steps.",
            },
          ],
        },
        1,
      ),
      block(
        "testimonials",
        {
          heading: "Client Success Stories",
          items: [
            {
              name: "David L.",
              role: "Founder",
              quote:
                "The consultation alone gave me a clear direction. The results have been incredible.",
            },
            {
              name: "Lisa K.",
              role: "Managing Director",
              quote:
                "Professional, insightful, and practical. Highly recommend booking a session.",
            },
          ],
        },
        2,
      ),
      block(
        "social_proof",
        {
          heading: "Our Track Record",
          stats: [
            { value: "500+", label: "Clients Served" },
            { value: "95%", label: "Satisfaction Rate" },
            { value: "12+", label: "Years Experience" },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Book Your Free Consultation",
          description:
            "Fill in your details and we'll be in touch within 24 hours.",
          buttonText: "Book My Session",
          fields: ["email", "first_name", "last_name", "phone"],
        },
        4,
      ),
    ],
  },
  // ============================================================================
  // ADDITIONAL HIGH-CONVERTING TEMPLATES
  // ============================================================================
  {
    id: "course-enrollment",
    name: "Course / Workshop Enrollment",
    description:
      "Enroll students in an online course, workshop, or training programme with a persuasive, structured layout.",
    category: "Education",
    thumbnail: "/images/templates/course-enrollment.png",
    defaultSeo: {
      metaTitle: "Enroll Now — Transform Your Skills",
      metaDescription:
        "Join our comprehensive course and gain the skills top professionals use. Limited seats available.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Master New Skills in Just 4 Weeks",
          subheading:
            "A step-by-step programme designed for busy professionals. No prior experience needed.",
          buttonText: "Enroll Now",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "social_proof",
        {
          heading: "Join a Growing Community",
          stats: [
            { value: "3,200+", label: "Graduates" },
            { value: "4.8/5", label: "Student Rating" },
            { value: "92%", label: "Completion Rate" },
          ],
        },
        1,
      ),
      block(
        "features",
        {
          heading: "What You'll Master",
          items: [
            {
              icon: "lightbulb",
              title: "Core Foundations",
              description:
                "Build a rock-solid understanding of the fundamentals from day one.",
            },
            {
              icon: "zap",
              title: "Hands-On Projects",
              description:
                "Apply what you learn with real-world projects and exercises.",
            },
            {
              icon: "users",
              title: "Community & Support",
              description:
                "Get help from instructors and connect with fellow learners.",
            },
            {
              icon: "star",
              title: "Certificate of Completion",
              description:
                "Earn a recognised certificate to showcase your new skills.",
            },
          ],
        },
        2,
      ),
      block(
        "video",
        {
          heading: "Watch a Free Preview",
          videoUrl: "",
          videoType: "youtube",
        },
        3,
      ),
      block(
        "testimonials",
        {
          heading: "Hear From Our Graduates",
          items: [
            {
              name: "Amara N.",
              role: "Project Manager",
              quote:
                "This course gave me skills I use every single day at work. Completely worth the investment.",
            },
            {
              name: "Chen W.",
              role: "Freelancer",
              quote:
                "I went from beginner to confident practitioner in under a month. The support was incredible.",
            },
            {
              name: "Rachel S.",
              role: "Entrepreneur",
              quote:
                "Clear, well-structured, and practical. I've already recommended it to my entire team.",
            },
          ],
        },
        4,
      ),
      block(
        "pricing",
        {
          heading: "Choose Your Learning Path",
          plans: [
            {
              name: "Self-Paced",
              price: "$97",
              features: [
                "Full course access",
                "Downloadable resources",
                "Community forum access",
                "Certificate of completion",
              ],
            },
            {
              name: "Guided",
              price: "$197",
              features: [
                "Everything in Self-Paced",
                "Weekly live coaching calls",
                "Personal feedback on projects",
                "Priority email support",
              ],
              highlighted: true,
            },
          ],
        },
        5,
      ),
      block(
        "faq",
        {
          heading: "Common Questions",
          items: [
            {
              question: "How long do I have access to the course?",
              answer:
                "You get lifetime access. Learn at your own pace, revisit any module whenever you need.",
            },
            {
              question: "What if I'm a complete beginner?",
              answer:
                "Perfect — the course starts from scratch. No prior experience or special software required.",
            },
            {
              question: "Is there a money-back guarantee?",
              answer:
                "Yes, a full 30-day money-back guarantee. If it's not right for you, just let us know.",
            },
            {
              question: "Will I receive a certificate?",
              answer:
                "Yes. Upon completing all modules, you'll receive a downloadable certificate.",
            },
          ],
        },
        6,
      ),
      block(
        "cta",
        {
          heading: "Ready to Start Learning?",
          description:
            "Join 3,200+ graduates who transformed their careers. Enroll today.",
          buttonText: "Enroll Now",
          buttonAction: "scroll_to_form",
        },
        7,
      ),
      block(
        "optin_form",
        {
          heading: "Secure Your Seat",
          description:
            "Enter your details to get started. You'll receive instant access.",
          buttonText: "Enroll Now",
          fields: ["email", "first_name"],
        },
        8,
      ),
    ],
  },
  {
    id: "app-download",
    name: "App Download",
    description:
      "Drive mobile or desktop app downloads with a clean, feature-focused layout.",
    category: "Software",
    thumbnail: "/images/templates/app-download.png",
    defaultSeo: {
      metaTitle: "Download Our App — Free",
      metaDescription:
        "Get the app that thousands of people rely on every day. Available on all platforms.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "The App That Simplifies Your Life",
          subheading:
            "Available on iOS, Android, and Web. Download free and get started in seconds.",
          buttonText: "Download Now — It's Free",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "social_proof",
        {
          heading: "Loved by Thousands",
          stats: [
            { value: "50K+", label: "Downloads" },
            { value: "4.7★", label: "App Store Rating" },
            { value: "120+", label: "Countries" },
          ],
        },
        1,
      ),
      block(
        "features",
        {
          heading: "Why People Love It",
          items: [
            {
              icon: "zap",
              title: "Blazing Fast",
              description:
                "Loads instantly. No lag, no waiting. Built for speed.",
            },
            {
              icon: "shield",
              title: "Private & Secure",
              description:
                "We never sell your data. End-to-end encryption on everything.",
            },
            {
              icon: "globe",
              title: "Works Offline",
              description:
                "Use the app even without internet. Your data syncs when you're back online.",
            },
          ],
        },
        2,
      ),
      block(
        "gallery",
        {
          heading: "Screenshots",
          items: [],
          columns: 3,
        },
        3,
      ),
      block(
        "testimonials",
        {
          heading: "What Users Say",
          items: [
            {
              name: "Priya D.",
              role: "Daily User",
              quote:
                "I use this app every single day. It's simple, fast, and does exactly what I need.",
            },
            {
              name: "Tom H.",
              role: "Tech Reviewer",
              quote:
                "One of the best-designed apps I've reviewed this year. Clean and intuitive.",
            },
          ],
        },
        4,
      ),
      block(
        "faq",
        {
          heading: "Frequently Asked Questions",
          items: [
            {
              question: "Is the app really free?",
              answer:
                "Yes. The core app is completely free. Optional premium features are available for power users.",
            },
            {
              question: "Which platforms are supported?",
              answer:
                "iOS 15+, Android 10+, and all modern web browsers. Mac and Windows desktop apps coming soon.",
            },
            {
              question: "How do I get support?",
              answer:
                "Tap the help icon in the app or email our support team. We typically respond within 2 hours.",
            },
          ],
        },
        5,
      ),
      block(
        "cta",
        {
          heading: "Ready to Get Started?",
          description: "Download now — it takes less than 30 seconds.",
          buttonText: "Get the App",
        },
        6,
      ),
    ],
  },
  {
    id: "agency-services",
    name: "Agency / Services",
    description:
      "Showcase your agency or professional services and generate qualified leads.",
    category: "Services",
    thumbnail: "/images/templates/agency-services.png",
    defaultSeo: {
      metaTitle: "Professional Services That Deliver Results",
      metaDescription:
        "Partner with our experienced team to grow your business. Book a free consultation today.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "We Help Businesses Grow — Predictably",
          subheading:
            "Strategy, execution, and results. Our team has helped 500+ businesses increase revenue.",
          buttonText: "Get a Free Quote",
          buttonAction: "scroll_to_form",
          backgroundStyle: "dark",
        },
        0,
      ),
      block(
        "social_proof",
        {
          heading: "Trusted by Industry Leaders",
          stats: [
            { value: "500+", label: "Projects Delivered" },
            { value: "98%", label: "Client Retention" },
            { value: "15+", label: "Years in Business" },
            { value: "$50M+", label: "Revenue Generated" },
          ],
        },
        1,
      ),
      block(
        "features",
        {
          heading: "Our Services",
          items: [
            {
              icon: "rocket",
              title: "Growth Strategy",
              description:
                "Data-driven strategies tailored to your market and objectives.",
            },
            {
              icon: "globe",
              title: "Digital Marketing",
              description:
                "SEO, paid ads, content marketing, and social media that convert.",
            },
            {
              icon: "zap",
              title: "Brand Development",
              description:
                "Build a brand identity that stands out and builds trust.",
            },
            {
              icon: "shield",
              title: "Technology Solutions",
              description:
                "Web apps, mobile apps, and systems that scale with your business.",
            },
          ],
        },
        2,
      ),
      block(
        "testimonials",
        {
          heading: "Client Results",
          items: [
            {
              name: "Michael T.",
              role: "CEO, TechStart Inc.",
              quote:
                "They doubled our leads in 3 months. The ROI was clear from month one.",
            },
            {
              name: "Sandra K.",
              role: "Director, GreenLeaf Solutions",
              quote:
                "Professional, responsive, and strategic. Our best agency partnership by far.",
            },
            {
              name: "James R.",
              role: "Founder, Urban Eats",
              quote:
                "From zero online presence to 1,000+ customers a month. Absolutely transformed our business.",
            },
          ],
        },
        3,
      ),
      block(
        "faq",
        {
          heading: "Questions? We've Got Answers",
          items: [
            {
              question: "How long does a typical project take?",
              answer:
                "Most projects are delivered within 4–8 weeks. We'll give you a clear timeline during our initial consultation.",
            },
            {
              question: "Do you work with small businesses?",
              answer:
                "Absolutely. We work with businesses of all sizes, from startups to established enterprises.",
            },
            {
              question: "What's your pricing like?",
              answer:
                "We offer flexible packages starting from project-based pricing. Book a free consultation for a custom quote.",
            },
          ],
        },
        4,
      ),
      block(
        "cta",
        {
          heading: "Let's Build Something Great Together",
          description:
            "Book a free strategy call and discover how we can help you grow.",
          buttonText: "Get Your Free Quote",
        },
        5,
      ),
      block(
        "optin_form",
        {
          heading: "Request a Free Consultation",
          description:
            "Fill in your details and one of our strategists will be in touch within 24 hours.",
          buttonText: "Get My Free Quote",
          fields: ["email", "first_name", "last_name", "phone", "company"],
        },
        6,
      ),
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter Signup",
    description:
      "A minimal, focused page designed to maximise email newsletter subscriptions.",
    category: "Lead Generation",
    thumbnail: "/images/templates/newsletter.png",
    defaultSeo: {
      metaTitle: "Join Our Newsletter — Stay Ahead",
      metaDescription:
        "Get weekly insights, tips, and exclusive content delivered straight to your inbox. Free forever.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Stay Ahead of the Curve",
          subheading:
            "Join 8,000+ subscribers who get actionable insights every week. No spam, no fluff — just value.",
          buttonText: "Subscribe Free",
          buttonAction: "scroll_to_form",
          backgroundStyle: "gradient",
        },
        0,
      ),
      block(
        "features",
        {
          heading: "What You'll Get Every Week",
          items: [
            {
              icon: "lightbulb",
              title: "Expert Analysis",
              description:
                "Deep dives into trends that matter, written by practitioners.",
            },
            {
              icon: "zap",
              title: "Quick-Win Tips",
              description:
                "Actionable advice you can implement in under 5 minutes.",
            },
            {
              icon: "gift",
              title: "Exclusive Resources",
              description:
                "Templates, checklists, and tools only available to subscribers.",
            },
          ],
        },
        1,
      ),
      block(
        "social_proof",
        {
          heading: "",
          stats: [
            { value: "8,000+", label: "Subscribers" },
            { value: "52%", label: "Open Rate" },
            { value: "Every Tuesday", label: "Delivery" },
          ],
        },
        2,
      ),
      block(
        "testimonials",
        {
          heading: "What Readers Say",
          items: [
            {
              name: "Alex P.",
              role: "Product Manager",
              quote:
                "This is the one newsletter I actually open every week. Consistently valuable.",
            },
            {
              name: "Maria C.",
              role: "Startup Founder",
              quote:
                "Short, sharp, and always relevant. It's become part of my Tuesday morning routine.",
            },
          ],
        },
        3,
      ),
      block(
        "optin_form",
        {
          heading: "Join 8,000+ Subscribers",
          description:
            "One email per week. Unsubscribe at any time. Your inbox, your rules.",
          buttonText: "Subscribe — It's Free",
          fields: ["email"],
        },
        4,
      ),
    ],
  },
  {
    id: "fitness-health",
    name: "Fitness / Health Programme",
    description:
      "Promote a fitness plan, health programme, or wellness product with before-after social proof.",
    category: "Health & Fitness",
    thumbnail: "/images/templates/fitness-health.png",
    defaultSeo: {
      metaTitle: "Transform Your Body in 30 Days",
      metaDescription:
        "Join thousands who've achieved their fitness goals with our proven programme. Start your transformation today.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Transform Your Body in 30 Days",
          subheading:
            "A proven, step-by-step programme for busy people. No gym required. No equipment needed.",
          buttonText: "Start My Transformation",
          buttonAction: "scroll_to_form",
          backgroundStyle: "dark",
        },
        0,
      ),
      block(
        "social_proof",
        {
          heading: "Real Results, Real People",
          stats: [
            { value: "12,000+", label: "Transformations" },
            { value: "4.9/5", label: "Average Rating" },
            { value: "30 Days", label: "Programme Length" },
          ],
        },
        1,
      ),
      block(
        "features",
        {
          heading: "What's Included",
          items: [
            {
              icon: "check",
              title: "Daily Workout Plans",
              description:
                "15–30 minute home workouts for all fitness levels. Follow along with video.",
            },
            {
              icon: "check",
              title: "Nutrition Guide",
              description:
                "Simple meal plans with recipes that take less than 20 minutes to prepare.",
            },
            {
              icon: "check",
              title: "Progress Tracking",
              description:
                "Weekly check-ins, measurements, and photos to track your transformation.",
            },
            {
              icon: "check",
              title: "Community Support",
              description:
                "Join our private group of 12,000+ members for motivation and accountability.",
            },
          ],
        },
        2,
      ),
      block(
        "testimonials",
        {
          heading: "Success Stories",
          items: [
            {
              name: "Jessica M.",
              role: "Lost 8kg in 30 days",
              quote:
                "I've tried dozens of programmes. This is the first one I actually finished — and the results speak for themselves.",
            },
            {
              name: "David O.",
              role: "Gained confidence and energy",
              quote:
                "Not just about losing weight. I sleep better, have more energy, and feel stronger than ever.",
            },
            {
              name: "Priya K.",
              role: "Busy mum of 3",
              quote:
                "As a working mum, I needed something quick and realistic. This was perfect. 20 minutes a day changed everything.",
            },
          ],
        },
        3,
      ),
      block(
        "countdown",
        {
          heading: "Next Group Starts In",
          targetDate: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          style: "cards",
        },
        4,
      ),
      block(
        "faq",
        {
          heading: "Your Questions Answered",
          items: [
            {
              question: "Do I need gym equipment?",
              answer:
                "No. Every workout uses your body weight only. You can do them in your living room.",
            },
            {
              question: "I'm a complete beginner. Is this for me?",
              answer:
                "Yes! The programme has beginner, intermediate, and advanced variations for every exercise.",
            },
            {
              question: "What if I don't see results?",
              answer:
                "We offer a full money-back guarantee. If you follow the plan and don't see results, we'll refund you.",
            },
            {
              question: "How much time does it take per day?",
              answer:
                "15–30 minutes, depending on the workout. Designed for people with busy schedules.",
            },
          ],
        },
        5,
      ),
      block(
        "cta",
        {
          heading: "Your Transformation Starts Today",
          description:
            "12,000 people already made the change. Will you be next?",
          buttonText: "Start My Journey",
        },
        6,
      ),
      block(
        "optin_form",
        {
          heading: "Join the Next Challenge",
          description:
            "Enter your details to secure your place. You'll receive instant access to the starter guide.",
          buttonText: "Start My Transformation",
          fields: ["email", "first_name"],
        },
        7,
      ),
    ],
  },
  {
    id: "real-estate",
    name: "Property / Real Estate",
    description:
      "Showcase a property listing, development, or real estate service with a professional layout.",
    category: "Real Estate",
    thumbnail: "/images/templates/real-estate.png",
    defaultSeo: {
      metaTitle: "Exclusive Property Listing — View Details",
      metaDescription:
        "Explore this stunning property with full details, floor plans, and virtual tour. Schedule a viewing today.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "Your Dream Home Awaits",
          subheading:
            "Premium property in a prime location. Modern finishes, spacious living, and breathtaking views.",
          buttonText: "Schedule a Viewing",
          buttonAction: "scroll_to_form",
          backgroundStyle: "image",
        },
        0,
      ),
      block(
        "features",
        {
          heading: "Property Highlights",
          items: [
            {
              icon: "check",
              title: "3+ Bedrooms",
              description:
                "Spacious bedrooms with built-in wardrobes and natural light.",
            },
            {
              icon: "check",
              title: "Modern Kitchen",
              description:
                "Fully fitted kitchen with premium appliances and granite countertops.",
            },
            {
              icon: "check",
              title: "24/7 Security",
              description:
                "Gated community with CCTV, boom gate, and on-site security.",
            },
            {
              icon: "check",
              title: "Prime Location",
              description:
                "Minutes from schools, shopping centres, and major transport links.",
            },
          ],
        },
        1,
      ),
      block(
        "gallery",
        {
          heading: "Photo Gallery",
          items: [],
          columns: 3,
        },
        2,
      ),
      block(
        "video",
        {
          heading: "Virtual Tour",
          videoUrl: "",
          videoType: "youtube",
        },
        3,
      ),
      block(
        "social_proof",
        {
          heading: "",
          stats: [
            { value: "15+", label: "Units Sold" },
            { value: "4", label: "Show Houses This Month" },
            { value: "2", label: "Units Remaining" },
          ],
        },
        4,
      ),
      block(
        "faq",
        {
          heading: "Property FAQs",
          items: [
            {
              question: "What financing options are available?",
              answer:
                "We work with multiple banks and building societies to help you find the best mortgage rates. Pre-approval assistance available.",
            },
            {
              question: "When can I move in?",
              answer:
                "Ready for immediate occupation. Completed units available for viewing and handover within 30 days of purchase.",
            },
            {
              question: "Are there any body corporate / HOA fees?",
              answer:
                "Yes. The monthly levy covers security, garden maintenance, and communal area upkeep. Full breakdown available on request.",
            },
          ],
        },
        5,
      ),
      block(
        "cta",
        {
          heading: "Only 2 Units Remaining",
          description:
            "Properties at this address are selling fast. Don't miss your chance.",
          buttonText: "Book a Viewing",
        },
        6,
      ),
      block(
        "optin_form",
        {
          heading: "Schedule a Viewing",
          description:
            "Enter your details and our property consultant will contact you within 24 hours.",
          buttonText: "Book My Viewing",
          fields: ["email", "first_name", "last_name", "phone"],
        },
        7,
      ),
    ],
  },
  {
    id: "event-ticket",
    name: "Event / Conference",
    description:
      "Sell tickets or registrations for an event, conference, or meetup with urgency and social proof.",
    category: "Events",
    thumbnail: "/images/templates/event-ticket.png",
    defaultSeo: {
      metaTitle: "Join the Biggest Event of the Year",
      metaDescription:
        "Secure your ticket now. World-class speakers, hands-on workshops, and unmatched networking.",
    },
    blocks: [
      block(
        "hero",
        {
          heading: "The Event Every Professional Needs to Attend",
          subheading:
            "2 days. 20+ speakers. Unlimited networking. One event that changes everything.",
          buttonText: "Get Your Ticket",
          buttonAction: "scroll_to_form",
          backgroundStyle: "dark",
        },
        0,
      ),
      block(
        "countdown",
        {
          heading: "Event Starts In",
          targetDate: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          style: "cards",
        },
        1,
      ),
      block(
        "social_proof",
        {
          heading: "",
          stats: [
            { value: "2,000+", label: "Expected Attendees" },
            { value: "20+", label: "Expert Speakers" },
            { value: "15+", label: "Workshops" },
          ],
        },
        2,
      ),
      block(
        "features",
        {
          heading: "What to Expect",
          items: [
            {
              icon: "star",
              title: "Keynote Speakers",
              description:
                "Hear from industry leaders and thought leaders who are shaping the future.",
            },
            {
              icon: "users",
              title: "Networking",
              description:
                "Connect with professionals from 50+ companies and build lasting relationships.",
            },
            {
              icon: "lightbulb",
              title: "Hands-On Workshops",
              description:
                "Participate in interactive sessions and leave with practical takeaways.",
            },
            {
              icon: "gift",
              title: "Swag & Surprises",
              description:
                "Every attendee receives a welcome pack, lunch, and exclusive resources.",
            },
          ],
        },
        3,
      ),
      block(
        "testimonials",
        {
          heading: "From Past Attendees",
          items: [
            {
              name: "Alice B.",
              role: "Product Lead",
              quote:
                "Best industry event I've attended. The speakers were phenomenal and the connections invaluable.",
            },
            {
              name: "Robert M.",
              role: "CTO",
              quote:
                "Walked away with a notebook full of ideas and three new partnerships. Worth every penny.",
            },
          ],
        },
        4,
      ),
      block(
        "pricing",
        {
          heading: "Ticket Options",
          plans: [
            {
              name: "General Admission",
              price: "$149",
              features: [
                "Access to all talks",
                "Lunch included",
                "Welcome pack",
                "Networking areas",
              ],
            },
            {
              name: "VIP Pass",
              price: "$349",
              features: [
                "Everything in General",
                "Front-row seating",
                "VIP lounge access",
                "Speaker meet & greet",
                "Exclusive workshops",
              ],
              highlighted: true,
            },
          ],
        },
        5,
      ),
      block(
        "faq",
        {
          heading: "Event FAQs",
          items: [
            {
              question: "Where is the event held?",
              answer:
                "The venue details will be emailed to all ticket holders 7 days before the event.",
            },
            {
              question: "Can I get a refund?",
              answer:
                "Full refunds are available up to 7 days before the event. After that, tickets can be transferred to another person.",
            },
            {
              question: "Is there a virtual attendance option?",
              answer:
                "Yes, a livestream option is available for all General Admission talks. VIP workshops are in-person only.",
            },
          ],
        },
        6,
      ),
      block(
        "cta",
        {
          heading: "Seats Are Filling Fast",
          description:
            "Last year's event sold out 2 weeks early. Secure your spot now.",
          buttonText: "Get My Ticket",
        },
        7,
      ),
      block(
        "optin_form",
        {
          heading: "Register Now",
          description:
            "Secure your ticket today. You'll receive confirmation and event details by email.",
          buttonText: "Register for the Event",
          fields: ["email", "first_name", "last_name"],
        },
        8,
      ),
    ],
  },
];
