/**
 * LP Builder Pro – System Seed Templates (LPB-07)
 *
 * 14 ready-to-use landing page templates built with Studio components.
 * These are merged with DB templates in getLPTemplates().
 */

import type { LPTemplate, LPTemplateCategory } from "../types/lp-builder-types";

// ---------------------------------------------------------------------------
// Helper to keep templates terse
// ---------------------------------------------------------------------------
function tpl(
  id: string,
  name: string,
  description: string,
  category: LPTemplateCategory,
  children: Record<string, unknown>[],
  settings?: Partial<LPTemplate["settings"]>,
): LPTemplate {
  return {
    id: `system-${id}`,
    name,
    description,
    category,
    isSystem: true,
    usageCount: 0,
    settings: {
      showHeader: false,
      showFooter: false,
      ...settings,
    },
    contentStudio: {
      root: {
        type: "Section",
        props: { background: "transparent", padding: "0" },
        children,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const LP_SYSTEM_TEMPLATES: LPTemplate[] = [
  // ── 1. Lead Magnet ──────────────────────────────────────────────────────
  tpl(
    "lead-magnet",
    "Lead Magnet Download",
    "Capture emails by offering a free guide, checklist, or resource.",
    "lead-gen",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Download Your Free Guide",
          subheadline:
            "Get our step-by-step playbook that helped 5,000+ businesses grow revenue by 40%.",
          ctaText: "Get Instant Access",
          ctaUrl: "#form",
          minHeight: "70vh",
          verticalAlign: "center",
          textAlign: "center",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "horizontal",
          heading: "",
          iconSize: "sm",
          badgesJson: JSON.stringify([
            {
              icon: "Download",
              title: "Instant PDF",
              description: "Delivered to your inbox",
            },
            {
              icon: "Users",
              title: "5,000+ Downloaded",
              description: "Join the community",
            },
            {
              icon: "Shield",
              title: "No Spam",
              description: "Unsubscribe anytime",
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Enter Your Email",
          submitText: "Send Me the Guide",
          fields: "email",
          redirectUrl: "/thank-you",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "grid",
          title: "What Readers Are Saying",
          columns: "3",
          maxVisible: "3",
          cardStyle: "bordered",
          showRatings: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Sarah K.",
              role: "Marketing Director",
              text: "This guide was a game-changer for our team.",
              rating: 5,
            },
            {
              name: "James M.",
              role: "Founder",
              text: "Clear, actionable advice. Highly recommend.",
              rating: 5,
            },
            {
              name: "Lisa T.",
              role: "Consultant",
              text: "I wish I had found this sooner!",
              rating: 4,
            },
          ]),
        },
      },
    ],
  ),

  // ── 2. Webinar Registration ──────────────────────────────────────────────
  tpl(
    "webinar",
    "Webinar Registration",
    "Drive sign-ups for a live or on-demand webinar with urgency timer.",
    "webinar",
    [
      {
        type: "LPHero",
        props: {
          variant: "split-left",
          headline: "Free Live Webinar: Master Your Market",
          subheadline:
            "Join industry experts for 60 minutes of actionable strategies that drive real results.",
          ctaText: "Reserve Your Seat",
          ctaUrl: "#form",
          minHeight: "75vh",
        },
      },
      {
        type: "LPCountdown",
        props: {
          mode: "fixed",
          variant: "boxes",
          urgencyText: "Webinar starts in:",
          showLabels: "true",
          showSeconds: "true",
          expiredAction: "show-message",
          expiredMessage: "The webinar has started — join now!",
          paddingY: "48",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Featured speakers from",
          variant: "scroll",
          grayscale: "true",
          logosJson: "[]",
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Register Now — Seats Are Limited",
          submitText: "Save My Spot",
          fields: "name,email",
        },
      },
    ],
  ),

  // ── 3. Product Launch ────────────────────────────────────────────────────
  tpl(
    "product-launch",
    "Product Launch",
    "Announce a new product with pricing, features, and social proof.",
    "product-launch",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Introducing [Product Name]",
          subheadline:
            "The all-in-one solution designed to save you time and grow your business.",
          ctaText: "See Pricing",
          ctaUrl: "#pricing",
          minHeight: "80vh",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Trusted by leading companies",
          variant: "scroll",
          grayscale: "true",
          logosJson: "[]",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "carousel",
          title: "What Early Adopters Say",
          autoPlay: "true",
          autoPlayInterval: "6000",
          cardStyle: "shadow",
          showRatings: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Alex R.",
              role: "CTO",
              company: "TechCorp",
              text: "We reduced setup time by 70%.",
              rating: 5,
            },
            {
              name: "Priya S.",
              role: "VP Engineering",
              company: "ScaleUp",
              text: "Best tool we've adopted this year.",
              rating: 5,
            },
          ]),
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "Simple, Transparent Pricing",
          subtitle: "Start free. Upgrade when you're ready.",
          showAnnualToggle: "true",
          annualDiscount: "20",
          highlightPopular: "true",
          plansJson: JSON.stringify([
            {
              name: "Starter",
              price: "K0",
              period: "/mo",
              description: "For individuals getting started",
              features: [
                { text: "1 project", included: true },
                { text: "Basic analytics", included: true },
                { text: "Priority support", included: false },
              ],
              ctaText: "Start Free",
              ctaUrl: "#",
            },
            {
              name: "Pro",
              price: "K299",
              annualPrice: "K239",
              period: "/mo",
              description: "For growing teams",
              features: [
                { text: "Unlimited projects", included: true },
                { text: "Advanced analytics", included: true },
                { text: "Priority support", included: true },
              ],
              ctaText: "Go Pro",
              ctaUrl: "#",
              isPopular: true,
              badgeText: "Most Popular",
            },
            {
              name: "Enterprise",
              price: "K999",
              annualPrice: "K799",
              period: "/mo",
              description: "For large organizations",
              features: [
                { text: "Unlimited everything", included: true },
                { text: "Custom integrations", included: true },
                { text: "Dedicated account manager", included: true },
              ],
              ctaText: "Contact Sales",
              ctaUrl: "#",
            },
          ]),
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "horizontal",
          badgesJson: JSON.stringify([
            {
              icon: "Shield",
              title: "Secure",
              description: "256-bit encryption",
            },
            {
              icon: "RefreshCcw",
              title: "30-Day Guarantee",
              description: "Full refund, no questions",
            },
            {
              icon: "Headphones",
              title: "24/7 Support",
              description: "We're here to help",
            },
          ]),
        },
      },
    ],
  ),

  // ── 4. Coming Soon ───────────────────────────────────────────────────────
  tpl(
    "coming-soon",
    "Coming Soon",
    "Build hype with a countdown and waitlist for an upcoming launch.",
    "coming-soon",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Something Big Is Coming",
          subheadline:
            "Be the first to know when we launch. Join the waitlist for exclusive early access.",
          ctaText: "Notify Me",
          ctaUrl: "#form",
          minHeight: "60vh",
        },
      },
      {
        type: "LPCountdown",
        props: {
          mode: "fixed",
          variant: "circular",
          urgencyText: "Launching in:",
          showLabels: "true",
          showSeconds: "true",
          expiredAction: "show-message",
          expiredMessage: "We're live! Check it out.",
          paddingY: "64",
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "inline",
          heading: "Join the Waitlist",
          submitText: "Count Me In",
          fields: "email",
        },
      },
    ],
  ),

  // ── 5. Flash Sale / Promo ────────────────────────────────────────────────
  tpl(
    "flash-sale",
    "Flash Sale",
    "Time-limited promotion with urgency countdown and floating CTA.",
    "sale-promo",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Flash Sale — Up to 60% Off",
          subheadline:
            "Our biggest sale of the year. Once it's gone, it's gone.",
          ctaText: "Shop Now",
          ctaUrl: "#",
          minHeight: "70vh",
        },
      },
      {
        type: "LPCountdown",
        props: {
          mode: "evergreen",
          evergreenDays: "0",
          evergreenHours: "4",
          evergreenMinutes: "0",
          variant: "inline",
          urgencyText: "Sale ends in:",
          showLabels: "true",
          showSeconds: "true",
          expiredAction: "hide",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "inline",
          badgesJson: JSON.stringify([
            {
              icon: "Truck",
              title: "Free Shipping",
              description: "On orders over K500",
            },
            {
              icon: "RefreshCcw",
              title: "Easy Returns",
              description: "14-day return policy",
            },
            {
              icon: "CreditCard",
              title: "Secure Payment",
              description: "All major cards accepted",
            },
          ]),
        },
      },
      {
        type: "LPFloatingCTA",
        props: {
          text: "Sale ends soon — don't miss out!",
          ctaText: "Shop the Sale",
          ctaUrl: "#",
          position: "bottom",
          animation: "slide",
          dismissible: "true",
          showOnMobile: "true",
          showAfterScroll: "10",
        },
      },
    ],
  ),

  // ── 6. eBook Download ────────────────────────────────────────────────────
  tpl(
    "ebook-download",
    "eBook Download",
    "Promote a free or paid eBook with a clean reading-focused layout.",
    "ebook-download",
    [
      {
        type: "LPHero",
        props: {
          variant: "split-right",
          headline: "The Definitive Guide to [Topic]",
          subheadline:
            "200+ pages of expert insights, case studies, and practical frameworks.",
          ctaText: "Download Free eBook",
          ctaUrl: "#form",
          minHeight: "70vh",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "single-featured",
          title: "",
          maxVisible: "1",
          showRatings: "true",
          cardStyle: "default",
          testimonialsJson: JSON.stringify([
            {
              name: "David L.",
              role: "CEO",
              company: "GrowthCo",
              text: "This eBook replaced three courses I was planning to buy. Invaluable resource.",
              rating: 5,
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Get Your Free Copy",
          submitText: "Download Now",
          fields: "name,email",
        },
      },
    ],
  ),

  // ── 7. Free Trial ────────────────────────────────────────────────────────
  tpl(
    "free-trial",
    "Free Trial Sign-Up",
    "Convert visitors into trial users with a benefits-focused layout.",
    "free-trial",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Start Your Free 14-Day Trial",
          subheadline: "No credit card required. Full access to all features.",
          ctaText: "Start Free Trial",
          ctaUrl: "#form",
          minHeight: "65vh",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Trusted by 2,000+ businesses",
          variant: "scroll",
          grayscale: "true",
          logosJson: "[]",
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "What You Get in the Trial",
          subtitle: "Full access, no limits",
          columns: "2",
          showAnnualToggle: "false",
          highlightPopular: "false",
          plansJson: JSON.stringify([
            {
              name: "Free Trial",
              price: "K0",
              period: "/14 days",
              features: [
                { text: "All premium features", included: true },
                { text: "Unlimited users", included: true },
                { text: "Data export", included: true },
                { text: "Email support", included: true },
              ],
              ctaText: "Start Trial",
              ctaUrl: "#form",
            },
            {
              name: "After Trial",
              price: "K199",
              period: "/mo",
              features: [
                { text: "Everything in trial", included: true },
                { text: "Priority support", included: true },
                { text: "Advanced analytics", included: true },
                { text: "Custom integrations", included: true },
              ],
              ctaText: "View Plans",
              ctaUrl: "#",
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Create Your Account",
          submitText: "Start Free Trial",
          fields: "name,email",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "horizontal",
          badgesJson: JSON.stringify([
            {
              icon: "CreditCard",
              title: "No Credit Card",
              description: "Start risk-free",
            },
            {
              icon: "Clock",
              title: "2-Minute Setup",
              description: "Ready in no time",
            },
            {
              icon: "Shield",
              title: "Cancel Anytime",
              description: "Zero commitment",
            },
          ]),
        },
      },
    ],
  ),

  // ── 8. Consultation Booking ──────────────────────────────────────────────
  tpl(
    "consultation",
    "Free Consultation",
    "Book a discovery call or consultation with a trust-building layout.",
    "consultation",
    [
      {
        type: "LPHero",
        props: {
          variant: "split-left",
          headline: "Book Your Free Strategy Session",
          subheadline:
            "30 minutes with our experts to uncover growth opportunities — no strings attached.",
          ctaText: "Book Your Call",
          ctaUrl: "#form",
          minHeight: "75vh",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "carousel",
          title: "Client Success Stories",
          autoPlay: "true",
          autoPlayInterval: "5000",
          cardStyle: "shadow",
          showRatings: "true",
          showQuoteIcon: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Anna W.",
              role: "Owner",
              company: "BrightPath",
              text: "After one session they identified a K50,000 revenue opportunity we'd missed.",
              rating: 5,
            },
            {
              name: "Tom R.",
              role: "Director",
              company: "UrbanGrow",
              text: "Professional, insightful, and genuinely helpful. Highly recommend.",
              rating: 5,
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Request Your Free Consultation",
          submitText: "Book Now",
          fields: "name,email,phone",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "grid",
          iconSize: "lg",
          badgesJson: JSON.stringify([
            { icon: "Award", title: "10+ Years Experience", description: "" },
            { icon: "Users", title: "500+ Clients", description: "" },
            { icon: "Star", title: "4.9/5 Rating", description: "" },
            { icon: "Globe", title: "Nationwide Service", description: "" },
          ]),
        },
      },
    ],
  ),

  // ── 9. SaaS Sign-Up ─────────────────────────────────────────────────────
  tpl(
    "saas-signup",
    "SaaS Product Page",
    "Feature-rich landing page for a SaaS product with pricing and demo.",
    "saas-signup",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "The Smarter Way to [Solve Problem]",
          subheadline:
            "Automate your workflow, save 10+ hours per week, and scale effortlessly.",
          ctaText: "Get Started Free",
          ctaUrl: "#pricing",
          minHeight: "80vh",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Powering teams at",
          variant: "scroll",
          grayscale: "true",
          logosJson: "[]",
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "Plans for Every Stage",
          subtitle: "Start free, pay as you grow",
          columns: "3",
          showAnnualToggle: "true",
          annualDiscount: "25",
          highlightPopular: "true",
          plansJson: JSON.stringify([
            {
              name: "Free",
              price: "K0",
              period: "/mo",
              description: "For solo users",
              features: [
                { text: "1 workspace", included: true },
                { text: "100 records", included: true },
                { text: "Community support", included: true },
                { text: "API access", included: false },
              ],
              ctaText: "Sign Up Free",
              ctaUrl: "#",
            },
            {
              name: "Team",
              price: "K499",
              annualPrice: "K374",
              period: "/mo",
              description: "For growing teams",
              features: [
                { text: "Unlimited workspaces", included: true },
                { text: "10,000 records", included: true },
                { text: "Priority support", included: true },
                { text: "API access", included: true },
              ],
              ctaText: "Start Trial",
              ctaUrl: "#",
              isPopular: true,
              badgeText: "Best Value",
            },
            {
              name: "Business",
              price: "K1,499",
              annualPrice: "K1,124",
              period: "/mo",
              description: "For scaling companies",
              features: [
                { text: "Everything in Team", included: true },
                { text: "Unlimited records", included: true },
                { text: "SSO & audit logs", included: true },
                { text: "Dedicated CSM", included: true },
              ],
              ctaText: "Talk to Sales",
              ctaUrl: "#",
            },
          ]),
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "grid",
          title: "Loved by 2,000+ Teams",
          columns: "3",
          maxVisible: "3",
          cardStyle: "bordered",
          showRatings: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Chris P.",
              role: "Ops Lead",
              company: "FlowHQ",
              text: "Cut manual work by 60% in the first month.",
              rating: 5,
            },
            {
              name: "Yemi A.",
              role: "CTO",
              company: "AfriTech",
              text: "The API integration was seamless.",
              rating: 5,
            },
            {
              name: "Grace L.",
              role: "Product Manager",
              text: "Best UX of any tool in this category.",
              rating: 4,
            },
          ]),
        },
      },
    ],
  ),

  // ── 10. Newsletter Sign-Up ───────────────────────────────────────────────
  tpl(
    "newsletter",
    "Newsletter Sign-Up",
    "Minimal, focused page to grow your email list.",
    "newsletter",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Get Smarter in 5 Minutes",
          subheadline:
            "Join 10,000+ readers. One practical email every Tuesday — no fluff, no spam.",
          ctaText: "Subscribe",
          ctaUrl: "#form",
          minHeight: "50vh",
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "inline",
          heading: "",
          submitText: "Subscribe Free",
          fields: "email",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "masonry",
          title: "What Subscribers Say",
          columns: "2",
          maxVisible: "4",
          cardStyle: "flat",
          showRatings: "false",
          showQuoteIcon: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Mark D.",
              text: "The only newsletter I actually read every week.",
            },
            {
              name: "Rita S.",
              text: "Short, actionable, and always relevant.",
            },
            {
              name: "Joe T.",
              text: "Consistently the best thing in my inbox.",
            },
            { name: "Diana K.", text: "I've forwarded it to my entire team." },
          ]),
        },
      },
    ],
  ),

  // ── 11. Event Registration ───────────────────────────────────────────────
  tpl(
    "event-registration",
    "Event Registration",
    "Conference, meetup, or workshop registration with schedule highlights.",
    "event-registration",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "[Event Name] 2025",
          subheadline:
            "Join 500+ professionals for a day of learning, networking, and inspiration.",
          ctaText: "Register Now",
          ctaUrl: "#form",
          minHeight: "80vh",
        },
      },
      {
        type: "LPCountdown",
        props: {
          mode: "fixed",
          variant: "boxes",
          urgencyText: "Event starts in:",
          showLabels: "true",
          showSeconds: "false",
          expiredAction: "show-message",
          expiredMessage: "The event is happening now!",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Our Sponsors",
          variant: "grid",
          grayscale: "false",
          logosJson: "[]",
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "Ticket Options",
          subtitle: "Early bird pricing available",
          columns: "3",
          showAnnualToggle: "false",
          highlightPopular: "true",
          plansJson: JSON.stringify([
            {
              name: "General",
              price: "K250",
              period: "",
              features: [
                { text: "All sessions", included: true },
                { text: "Lunch included", included: true },
                { text: "Networking event", included: false },
                { text: "Workshop access", included: false },
              ],
              ctaText: "Get Ticket",
              ctaUrl: "#form",
            },
            {
              name: "VIP",
              price: "K750",
              period: "",
              features: [
                { text: "All sessions", included: true },
                { text: "Lunch included", included: true },
                { text: "Networking event", included: true },
                { text: "Workshop access", included: true },
              ],
              ctaText: "Get VIP",
              ctaUrl: "#form",
              isPopular: true,
              badgeText: "Best Experience",
            },
            {
              name: "Virtual",
              price: "K100",
              period: "",
              features: [
                { text: "Livestream access", included: true },
                { text: "Recordings", included: true },
                { text: "Networking event", included: false },
                { text: "Workshop access", included: false },
              ],
              ctaText: "Join Online",
              ctaUrl: "#form",
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Reserve Your Spot",
          submitText: "Register",
          fields: "name,email,phone",
        },
      },
    ],
  ),

  // ── 12. Course Enrollment ────────────────────────────────────────────────
  tpl(
    "course-enrollment",
    "Online Course",
    "Sell or enroll students in an online course with social proof.",
    "course-enrollment",
    [
      {
        type: "LPHero",
        props: {
          variant: "split-left",
          headline: "Master [Skill] in 30 Days",
          subheadline:
            "A structured, hands-on course with real projects, expert feedback, and a certificate.",
          ctaText: "Enroll Now",
          ctaUrl: "#pricing",
          minHeight: "75vh",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "grid",
          title: "Student Reviews",
          columns: "3",
          maxVisible: "6",
          cardStyle: "shadow",
          showRatings: "true",
          showImages: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Emily R.",
              text: "Best online course I've taken. Worth every kwacha.",
              rating: 5,
            },
            {
              name: "Brian K.",
              text: "The projects made everything click.",
              rating: 5,
            },
            {
              name: "Mwansa C.",
              text: "Got hired within 2 months of finishing.",
              rating: 5,
            },
          ]),
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "Choose Your Plan",
          columns: "2",
          showAnnualToggle: "false",
          highlightPopular: "true",
          plansJson: JSON.stringify([
            {
              name: "Self-Paced",
              price: "K499",
              period: "",
              description: "Learn at your own speed",
              features: [
                { text: "30 video lessons", included: true },
                { text: "Downloadable resources", included: true },
                { text: "Community access", included: true },
                { text: "1-on-1 mentoring", included: false },
              ],
              ctaText: "Start Learning",
              ctaUrl: "#",
            },
            {
              name: "Mentored",
              price: "K1,499",
              period: "",
              description: "With expert guidance",
              features: [
                { text: "Everything in Self-Paced", included: true },
                { text: "Weekly live sessions", included: true },
                { text: "1-on-1 mentoring", included: true },
                { text: "Certificate of completion", included: true },
              ],
              ctaText: "Enroll with Mentor",
              ctaUrl: "#",
              isPopular: true,
              badgeText: "Recommended",
            },
          ]),
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "horizontal",
          badgesJson: JSON.stringify([
            {
              icon: "GraduationCap",
              title: "1,200+ Graduates",
              description: "",
            },
            { icon: "Star", title: "4.8/5 Average Rating", description: "" },
            { icon: "RefreshCcw", title: "14-Day Refund", description: "" },
          ]),
        },
      },
    ],
  ),

  // ── 13. Agency Services ──────────────────────────────────────────────────
  tpl(
    "agency-services",
    "Agency Services",
    "Showcase your agency's services and capture qualified leads.",
    "agency-services",
    [
      {
        type: "LPHero",
        props: {
          variant: "centered",
          headline: "Grow Your Business with [Agency Name]",
          subheadline:
            "Strategy, design, and execution — all under one roof. Let's build something great.",
          ctaText: "Get a Free Quote",
          ctaUrl: "#form",
          minHeight: "80vh",
        },
      },
      {
        type: "LPLogoBar",
        props: {
          title: "Clients we've worked with",
          variant: "scroll",
          grayscale: "true",
          logosJson: "[]",
        },
      },
      {
        type: "LPTestimonialWall",
        props: {
          variant: "carousel",
          title: "Client Testimonials",
          autoPlay: "true",
          autoPlayInterval: "7000",
          cardStyle: "bordered",
          showRatings: "true",
          showQuoteIcon: "true",
          testimonialsJson: JSON.stringify([
            {
              name: "Rachel M.",
              role: "CMO",
              company: "FinServe",
              text: "They transformed our digital presence completely.",
              rating: 5,
            },
            {
              name: "Daniel O.",
              role: "Founder",
              company: "GreenLeaf",
              text: "Professional, creative, and always on time.",
              rating: 5,
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Request a Free Quote",
          submitText: "Get My Quote",
          fields: "name,email,phone,message",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "horizontal",
          badgesJson: JSON.stringify([
            {
              icon: "Award",
              title: "Award-Winning",
              description: "3x industry awards",
            },
            {
              icon: "Users",
              title: "100+ Clients",
              description: "Across 15 industries",
            },
            {
              icon: "Clock",
              title: "Fast Turnaround",
              description: "2-4 week delivery",
            },
          ]),
        },
      },
    ],
  ),

  // ── 14. Real Estate Listing ──────────────────────────────────────────────
  tpl(
    "real-estate",
    "Property Listing",
    "Showcase a property or development with inquiry form and trust signals.",
    "real-estate",
    [
      {
        type: "LPHero",
        props: {
          variant: "split-right",
          headline: "Luxury Living in [Location]",
          subheadline:
            "Modern 3-bed apartments from K1.2M. Show suite now open — book your viewing today.",
          ctaText: "Book a Viewing",
          ctaUrl: "#form",
          minHeight: "80vh",
        },
      },
      {
        type: "LPTrustBadges",
        props: {
          variant: "grid",
          iconSize: "lg",
          badgesJson: JSON.stringify([
            {
              icon: "Home",
              title: "Premium Finishes",
              description: "Italian marble, oak floors",
            },
            {
              icon: "Shield",
              title: "Title Deed",
              description: "Freehold ownership",
            },
            {
              icon: "MapPin",
              title: "Prime Location",
              description: "5 min to CBD",
            },
            {
              icon: "Car",
              title: "Secure Parking",
              description: "2 bays per unit",
            },
          ]),
        },
      },
      {
        type: "LPPricingTable",
        props: {
          variant: "cards",
          title: "Available Units",
          columns: "3",
          showAnnualToggle: "false",
          highlightPopular: "true",
          plansJson: JSON.stringify([
            {
              name: "1-Bed",
              price: "K850,000",
              period: "",
              features: [
                { text: "55 m² floor area", included: true },
                { text: "Balcony", included: true },
                { text: "1 parking bay", included: true },
              ],
              ctaText: "Enquire",
              ctaUrl: "#form",
            },
            {
              name: "2-Bed",
              price: "K1,200,000",
              period: "",
              features: [
                { text: "85 m² floor area", included: true },
                { text: "Balcony + patio", included: true },
                { text: "2 parking bays", included: true },
              ],
              ctaText: "Enquire",
              ctaUrl: "#form",
              isPopular: true,
              badgeText: "Most Popular",
            },
            {
              name: "3-Bed Penthouse",
              price: "K2,500,000",
              period: "",
              features: [
                { text: "150 m² floor area", included: true },
                { text: "Rooftop terrace", included: true },
                { text: "2 parking bays", included: true },
              ],
              ctaText: "Enquire",
              ctaUrl: "#form",
            },
          ]),
        },
      },
      {
        type: "LPForm",
        props: {
          variant: "card",
          heading: "Book a Viewing",
          submitText: "Request Viewing",
          fields: "name,email,phone",
        },
      },
      {
        type: "LPFloatingCTA",
        props: {
          text: "Limited units available",
          ctaText: "Book a Viewing",
          scrollToId: "form",
          position: "bottom",
          animation: "slide",
          dismissible: "true",
          showOnMobile: "true",
          showAfterScroll: "30",
        },
      },
    ],
  ),
];
