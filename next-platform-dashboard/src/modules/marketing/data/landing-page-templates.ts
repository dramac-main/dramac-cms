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
];
