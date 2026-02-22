/**
 * AI Website Designer - Output Converter
 * 
 * Converts the AI-generated website output (GeneratedPage[], GeneratedComponent[])
 * to the Studio format (StudioPageData) that can be rendered and saved.
 * 
 * This is the critical bridge between AI generation and the real Studio rendering system.
 */

import { nanoid } from "nanoid";
import type { StudioPageData, StudioComponent } from "@/types/studio";
import type { GeneratedPage, GeneratedComponent, WebsiteDesignerOutput } from "./types";

// =============================================================================
// LINK VALIDATION & FIXING
// =============================================================================

/** 
 * Default valid routes - these are common page types we expect
 * The actual pages generated will be used to validate links
 */
const DEFAULT_ROUTES = ["/", "/about", "/services", "/contact", "/menu", "/portfolio", "/work", "/gallery", "/team", "/pricing", "/faq", "/blog", "/shop", "/products", "/book", "/reserve", "/packages"];

/** Current page slugs being generated - set via setGeneratedPageSlugs() */
// NOTE: This is module-level mutable state. For thread safety in concurrent
// generations, the caller should use convertOutputToStudioPages() which 
// internally sets this before processing. For sequential use this is fine.
let generatedPageSlugs: string[] = [];

/**
 * Set the actual page slugs from the generated website
 * This should be called before converting pages to ensure links are valid
 * @deprecated Use convertOutputToStudioPages() which sets slugs automatically
 */
export function setGeneratedPageSlugs(slugs: string[]): void {
  generatedPageSlugs = slugs.map(s => s.startsWith('/') ? s : `/${s}`);
}

/**
 * Get the combined list of valid routes (generated pages + defaults)
 */
function getValidRoutes(): string[] {
  return [...new Set([...generatedPageSlugs, ...DEFAULT_ROUTES])];
}

/**
 * Find the best matching route for a broken/placeholder link
 */
function findBestRoute(context: string, validRoutes: string[]): string {
  const contextLower = context.toLowerCase();
  
  // Priority mappings - check in order
  const mappings: [string[], string[]][] = [
    [["contact", "quote", "reach", "call", "email"], ["/contact"]],
    [["book", "reserve", "appointment", "schedule"], ["/book", "/reserve", "/contact"]],
    [["menu", "food", "dish", "eat", "drink"], ["/menu"]],
    [["service", "what we", "offer"], ["/services"]],
    [["about", "story", "who we", "our team", "meet"], ["/about", "/team"]],
    [["work", "portfolio", "project", "case stud"], ["/portfolio", "/work", "/gallery"]],
    [["shop", "product", "buy", "store", "purchase"], ["/shop", "/products"]],
    [["price", "pricing", "cost", "plan"], ["/pricing"]],
    [["faq", "question", "help"], ["/faq"]],
    [["blog", "news", "article", "post"], ["/blog"]],
    [["gallery", "photo", "image"], ["/gallery"]],
    [["home", "start", "get started", "learn more"], ["/"]],
  ];

  for (const [keywords, possibleRoutes] of mappings) {
    if (keywords.some(kw => contextLower.includes(kw))) {
      // Find first matching route that exists
      for (const route of possibleRoutes) {
        if (validRoutes.includes(route)) {
          return route;
        }
      }
    }
  }
  
  // Default fallback - prefer contact if it exists, otherwise home
  if (validRoutes.includes("/contact")) return "/contact";
  return "/";
}

/**
 * Fix a link to ensure it's a valid route
 * Converts placeholder links (#, #section, empty) to appropriate pages
 */
function fixLink(href: string | undefined | null, context: string = "default"): string {
  const validRoutes = getValidRoutes();
  
  if (!href || href === "#" || href === "" || href.startsWith("#section")) {
    return findBestRoute(context, validRoutes);
  }
  
  // Preserve external URLs — never modify these
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  
  // Normalize the href
  let normalizedHref = href.toLowerCase().trim();
  
  // If it's already a valid-looking path
  if (normalizedHref.startsWith("/")) {
    // Check if this exact route exists
    if (validRoutes.includes(normalizedHref)) {
      return normalizedHref;
    }
    // Try without trailing slash
    const withoutTrailing = normalizedHref.replace(/\/$/, '');
    if (validRoutes.includes(withoutTrailing)) {
      return withoutTrailing;
    }
    // Route doesn't exist, find best match based on context
    return findBestRoute(context || normalizedHref, validRoutes);
  }
  
  // If it looks like a URL fragment, try to make it a route
  if (normalizedHref.startsWith("#")) {
    const routeGuess = normalizedHref.replace("#", "/");
    if (validRoutes.includes(routeGuess)) {
      return routeGuess;
    }
    return findBestRoute(context || routeGuess, validRoutes);
  }
  
  // Otherwise, prepend with / and check
  const asRoute = "/" + normalizedHref.replace(/\s+/g, "-");
  if (validRoutes.includes(asRoute)) {
    return asRoute;
  }
  
  // Fallback to context-based matching
  return findBestRoute(context, validRoutes);
}

/**
 * Recursively fix all links in an object
 */
function fixLinksInObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  // Keys that are navigation links (should be fixed)
  const navLinkKeys = ["link", "href", "ctaLink", "buttonLink", "primaryButtonLink", "secondaryButtonLink", "logoLink"];
  // Keys that are asset/image URLs (should NOT be fixed)
  const assetUrlKeys = ["logoUrl", "logo_url", "imageUrl", "image_url", "src", "image", "backgroundImage", "videoPoster", "videoSrc", "avatarUrl", "avatar_url", "icon"];
  
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    
    // Skip asset/image URL keys entirely
    if (assetUrlKeys.some(k => keyLower === k.toLowerCase())) {
      result[key] = value;
      continue;
    }
    
    // Check if this is a navigation link field
    const isNavLink = navLinkKeys.some(k => keyLower === k.toLowerCase()) || 
                      (keyLower.includes("link") || keyLower.includes("href")) && !keyLower.includes("url");
    
    if (isNavLink) {
      if (typeof value === "string") {
        result[key] = fixLink(value, String(obj.label || obj.text || obj.title || obj.ctaText || ""));
      } else {
        result[key] = value;
      }
    } else if (Array.isArray(value)) {
      // Recursively fix arrays
      result[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return fixLinksInObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === "object" && value !== null) {
      // Recursively fix nested objects
      result[key] = fixLinksInObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// =============================================================================
// CONVERTER FUNCTIONS
// =============================================================================

/**
 * Convert a single GeneratedPage to StudioPageData format
 */
export function convertPageToStudioFormat(page: GeneratedPage): StudioPageData {
  const components: Record<string, StudioComponent> = {};
  const rootChildren: string[] = [];

  // Process each component in the page
  for (const genComponent of page.components) {
    const studioComponent = convertComponentToStudio(genComponent);
    components[studioComponent.id] = studioComponent;
    rootChildren.push(studioComponent.id);
  }

  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {
        title: page.seo?.title || page.title,
        description: page.seo?.description || page.description,
      },
      children: rootChildren,
    },
    components,
    zones: {},
  };
}

/**
 * Convert a GeneratedComponent to StudioComponent format
 */
function convertComponentToStudio(genComponent: GeneratedComponent): StudioComponent {
  // Map AI component types to Studio component types
  const typeMap: Record<string, string> = {
    // AI tends to generate these types - map to Studio types
    "HeroBlock": "Hero",
    "HeroSection": "Hero",
    "FeaturesGridBlock": "Features",
    "FeaturesBlock": "Features",
    "FeatureGrid": "Features",
    "CTABlock": "CTA",
    "CTASection": "CTA",
    "ContentBlock": "RichText",
    "TextBlock": "Text",
    "ServicesGridBlock": "Features",
    "ServicesBlock": "Features",
    "TeamGridBlock": "Team",
    "TeamBlock": "Team",
    "ContactFormBlock": "ContactForm",
    "TestimonialsBlock": "Testimonials",
    "TestimonialBlock": "Testimonials",
    "PricingBlock": "Pricing",
    "PricingSection": "Pricing",
    "FAQBlock": "FAQ",
    "GalleryBlock": "Gallery",
    "StatsBlock": "Stats",
    "NavbarBlock": "Navbar",
    "FooterBlock": "Footer",
    "SectionBlock": "Section",
    "QuoteBlock": "Quote",
    "NewsletterBlock": "Newsletter",
    "AboutBlock": "Features",
    "AboutSection": "Features",
    "About": "Features",
    // Additional common AI variations
    "ServiceBlock": "Features",
    "ServiceSection": "Features",
    "ServiceCards": "Features",
    "ServiceList": "Features",
    "Services": "Features",
    "ServiceGrid": "Features",
    "BenefitsBlock": "Features",
    "BenefitsSection": "Features",
    "Benefits": "Features",
    "WhyUsBlock": "Features",
    "WhyUsSection": "Features",
    "WhyUs": "Features",
    "WhyChooseUs": "Features",
    "ProcessBlock": "Features",
    "ProcessSection": "Features",
    "Process": "Features",
    "StepsBlock": "Features",
    "Steps": "Features",
    "HowItWorks": "Features",
    "HowItWorksSection": "Features",
    // Logo/Trust
    "LogoCloudBlock": "LogoCloud",
    "LogoCloudSection": "LogoCloud",
    "PartnerLogos": "LogoCloud",
    "Partners": "LogoCloud",
    "TrustedBy": "LogoCloud",
    "TrustBadgesBlock": "TrustBadges",
    "TrustBadgesSection": "TrustBadges",
    "Badges": "TrustBadges",
    "Accreditations": "TrustBadges",
    "Credentials": "TrustBadges",
    "Certifications": "TrustBadges",
    // Social proof
    "SocialProofBlock": "SocialProof",
    "SocialProofSection": "SocialProof",
    "Reviews": "Testimonials",
    "ReviewsBlock": "Testimonials",
    "ReviewsSection": "Testimonials",
    "ClientReviews": "Testimonials",
    // Interactive
    "AccordionBlock": "Accordion",
    "AccordionSection": "Accordion",
    "TabsBlock": "Tabs",
    "TabsSection": "Tabs",
    "CarouselBlock": "Carousel",
    "CarouselSection": "Carousel",
    "CountdownBlock": "Countdown",
    "CountdownSection": "Countdown",
    // Comparison/Pricing variants
    "ComparisonBlock": "ComparisonTable",
    "ComparisonSection": "ComparisonTable",
    "ComparisonTableBlock": "ComparisonTable",
    // Announcement
    "AnnouncementBlock": "AnnouncementBar",
    "AnnouncementBarBlock": "AnnouncementBar",
    "Banner": "AnnouncementBar",
    "BannerBlock": "AnnouncementBar",
    // Map/Location
    "MapBlock": "Map",
    "MapSection": "Map",
    "LocationMap": "Map",
    "Location": "ContactForm",
    "LocationBlock": "ContactForm",
    "LocationSection": "ContactForm",
    // Video
    "VideoBlock": "Video",
    "VideoSection": "Video",
    "VideoPlayer": "Video",
    // Contact
    "ContactBlock": "ContactForm",
    "ContactSection": "ContactForm",
    "Contact": "ContactForm",
    "ContactInfoBlock": "ContactForm",
    "ContactInfo": "ContactForm",
    // Newsletter
    "NewsletterBlock": "Newsletter",
    "NewsletterSection": "Newsletter",
    "SubscribeBlock": "Newsletter",
    "Subscribe": "Newsletter",
    // Quote
    "QuoteBlock": "Quote",
    "QuoteSection": "Quote",
    "Blockquote": "Quote",
    // Code
    "CodeBlockSection": "CodeBlock",
    // Form
    "FormBlock": "Form",
    "FormSection": "Form",
    // Misc content
    "ContentSection": "RichText",
    "Content": "RichText",
    "MarkdownBlock": "RichText",
    "Markdown": "RichText",
    // Image
    "ImageBlock": "Image",
    "ImageSection": "Image",
    // Healthcare-specific AI inventions
    "PatientInfo": "Features",
    "PatientInfoSection": "Features",
    "PatientInfoBlock": "Features",
    "PatientResources": "Features",
    "InsuranceAccepted": "Features",
    "Insurance": "Features",
    "Appointment": "BookingWidget",
    "AppointmentBlock": "BookingWidget",
    "BookAppointment": "BookingWidget",
    "BookNow": "CTA",
    "BusinessHours": "Features",
    "OfficeHours": "Features",
    "OpeningHours": "Features",
    // Restaurant-specific
    "Menu": "Features",
    "MenuBlock": "Features",
    "MenuSection": "Features",
    "FoodMenu": "Features",
    "Reservation": "CTA",
    "ReservationBlock": "CTA",
    // Direct mappings
    "Hero": "Hero",
    "Features": "Features",
    "CTA": "CTA",
    "Testimonials": "Testimonials",
    "Pricing": "Pricing",
    "FAQ": "FAQ",
    "Gallery": "Gallery",
    "Stats": "Stats",
    "Team": "Team",
    "ContactForm": "ContactForm",
    "Navbar": "Navbar",
    "Footer": "Footer",
    "Section": "Section",
    "Container": "Container",
    "Heading": "Heading",
    "Text": "Text",
    "RichText": "RichText",
    "Image": "Image",
    "Button": "Button",
    "Divider": "Divider",
    "Spacer": "Spacer",
    "Accordion": "Accordion",
    "Tabs": "Tabs",
    "Carousel": "Carousel",
    "Countdown": "Countdown",
    "Modal": "Modal",
    "Map": "Map",
    "Video": "Video",
    "Quote": "Quote",
    "Newsletter": "Newsletter",
    "LogoCloud": "LogoCloud",
    "TrustBadges": "TrustBadges",
    "SocialProof": "SocialProof",
    "ComparisonTable": "ComparisonTable",
    "AnnouncementBar": "AnnouncementBar",
    "SocialLinks": "SocialLinks",
    "CodeBlock": "CodeBlock",
    "Form": "Form",
    "Badge": "Badge",
    "Typewriter": "Typewriter",
    "TypewriterText": "Typewriter",
    "TypingEffect": "Typewriter",
    "AnimatedText": "Typewriter",
    "Parallax": "Parallax",
    "ParallaxSection": "Parallax",
    "ParallaxScroll": "Parallax",
    // Module component type mappings
    "ServiceSelector": "BookingServiceSelector",
    "BookingServiceSelector": "BookingServiceSelector",
    "BookingWidget": "BookingWidget",
    "BookingCalendar": "BookingCalendar",
    "BookingForm": "BookingForm",
    "BookingEmbed": "BookingEmbed",
    "BookingStaffGrid": "BookingStaffGrid",
    "StaffGrid": "BookingStaffGrid",
    "ServiceSelector": "BookingServiceSelector",
    "AppointmentCalendar": "BookingCalendar",
    "AppointmentForm": "BookingForm",
    "AppointmentWidget": "BookingWidget",
    "ProductGrid": "EcommerceProductGrid",
    "EcommerceProductGrid": "EcommerceProductGrid",
    "FeaturedProducts": "EcommerceFeaturedProducts",
    "EcommerceFeaturedProducts": "EcommerceFeaturedProducts",
    "ProductCard": "EcommerceProductCard",
    "EcommerceProductCard": "EcommerceProductCard",
    "ProductCatalog": "EcommerceProductCatalog",
    "EcommerceProductCatalog": "EcommerceProductCatalog",
    "CartItems": "EcommerceCartPage",
    "CartPage": "EcommerceCartPage",
    "EcommerceCartPage": "EcommerceCartPage",
    "CartDrawer": "EcommerceCartDrawer",
    "EcommerceCartDrawer": "EcommerceCartDrawer",
    "CartSummary": "EcommerceMiniCart",
    "MiniCart": "EcommerceMiniCart",
    "EcommerceMiniCart": "EcommerceMiniCart",
    "CheckoutForm": "EcommerceCheckoutPage",
    "CheckoutPage": "EcommerceCheckoutPage",
    "EcommerceCheckoutPage": "EcommerceCheckoutPage",
    "OrderConfirmation": "EcommerceOrderConfirmation",
    "EcommerceOrderConfirmation": "EcommerceOrderConfirmation",
    "CategoryNav": "EcommerceCategoryNav",
    "CategoryNavigation": "EcommerceCategoryNav",
    "EcommerceCategoryNav": "EcommerceCategoryNav",
    "ProductSearch": "EcommerceSearchBar",
    "SearchBar": "EcommerceSearchBar",
    "EcommerceSearchBar": "EcommerceSearchBar",
    "FilterSidebar": "EcommerceFilterSidebar",
    "ProductFilters": "EcommerceFilterSidebar",
    "EcommerceFilterSidebar": "EcommerceFilterSidebar",
    "Breadcrumb": "EcommerceBreadcrumb",
    "Breadcrumbs": "EcommerceBreadcrumb",
    "EcommerceBreadcrumb": "EcommerceBreadcrumb",
    "ProductSort": "EcommerceProductSort",
    "SortBar": "EcommerceProductSort",
    "EcommerceProductSort": "EcommerceProductSort",
    "QuoteRequest": "EcommerceQuoteRequest",
    "EcommerceQuoteRequest": "EcommerceQuoteRequest",
    "QuoteList": "EcommerceQuoteList",
    "EcommerceQuoteList": "EcommerceQuoteList",
    "QuoteDetail": "EcommerceQuoteDetail",
    "EcommerceQuoteDetail": "EcommerceQuoteDetail",
    "ReviewForm": "EcommerceReviewForm",
    "EcommerceReviewForm": "EcommerceReviewForm",
    "ReviewList": "EcommerceReviewList",
    "ProductReviews": "EcommerceReviewList",
    "EcommerceReviewList": "EcommerceReviewList",
    "ProductDetail": "ProductDetailBlock",
    "ProductDetailBlock": "ProductDetailBlock",
    "CategoryHero": "CategoryHeroBlock",
    "CategoryHeroBlock": "CategoryHeroBlock",
  };

  const studioType = typeMap[genComponent.type] || genComponent.type;

  // =========================================================================
  // FUZZY FALLBACK: If the type isn't recognized by the registry, try
  // stripping common suffixes the AI sometimes adds (Block, Section, etc.)
  // and mapping to the closest known registry type.
  // =========================================================================
  let resolvedType = studioType;
  
  // Check if this type exists in the registry. If not, try fuzzy matching.
  const KNOWN_REGISTRY_TYPES = new Set([
    "Hero", "Features", "CTA", "Testimonials", "FAQ", "Stats", "Team", "Gallery",
    "Pricing", "LogoCloud", "TrustBadges", "SocialProof", "ComparisonTable", "AnnouncementBar",
    "RichText", "Quote", "CodeBlock", "Heading", "Text", "Image",
    "ContactForm", "Newsletter", "Form", "FormField",
    "Accordion", "Tabs", "Carousel", "Countdown", "Modal", "Typewriter", "Parallax",
    "Map", "Video", "SocialLinks",
    "Section", "Container", "Columns", "Card", "Divider", "Spacer",
    "Navbar", "Footer",
    // Module types — booking
    "BookingServiceSelector", "BookingWidget", "BookingCalendar", "BookingForm",
    "BookingEmbed", "BookingStaffGrid",
    // Module types — ecommerce (ALL 22 components)
    "EcommerceProductGrid", "EcommerceProductCard", "EcommerceProductCatalog",
    "EcommerceFeaturedProducts", "EcommerceCartPage", "EcommerceCartDrawer",
    "EcommerceMiniCart", "EcommerceCheckoutPage", "EcommerceOrderConfirmation",
    "EcommerceCategoryNav", "EcommerceSearchBar", "EcommerceFilterSidebar",
    "EcommerceBreadcrumb", "EcommerceProductSort",
    "EcommerceQuoteRequest", "EcommerceQuoteList", "EcommerceQuoteDetail",
    "EcommerceReviewForm", "EcommerceReviewList",
    "ProductDetailBlock", "CategoryHeroBlock",
  ]);
  
  if (!KNOWN_REGISTRY_TYPES.has(resolvedType)) {
    // Try stripping common suffixes
    const suffixStripped = resolvedType.replace(/(Block|Section|Component|Widget|Grid|List|Cards?|Panel|Area|Zone|Group|Bar|Row|Display|Wrapper|Item)$/i, '');
    if (KNOWN_REGISTRY_TYPES.has(suffixStripped)) {
      console.log(`[Converter] Fuzzy match: "${resolvedType}" → "${suffixStripped}"`);
      resolvedType = suffixStripped;
    } else {
      // Try semantic keyword matching for common AI-invented types
      const semanticMap: Record<string, string> = {
        // About/story/mission → Features (grid of cards)
        "about": "Features", "story": "Features", "ourstory": "Features",
        "mission": "Features", "values": "Features", "whyus": "Features",
        "whychooseus": "Features", "benefits": "Features", "advantages": "Features",
        // Services → Features
        "services": "Features", "service": "Features", "whatwedo": "Features",
        "offerings": "Features", "specialties": "Features",
        // Location/map/hours → ContactForm
        "location": "ContactForm", "locationmap": "ContactForm", "findus": "ContactForm",
        "visitreuneus": "ContactForm", "businesshours": "Features", "officehours": "Features",
        "hours": "Features", "openinghours": "Features",
        // Credentials/accreditations → TrustBadges
        "accreditations": "TrustBadges", "credentials": "TrustBadges",
        "certifications": "TrustBadges", "partners": "LogoCloud",
        "trustedby": "LogoCloud", "affiliations": "LogoCloud",
        // Appointment/booking → CTA
        "appointment": "BookingWidget", "bookappointment": "BookingWidget", "booking": "BookingWidget",
        "reserve": "CTA", "schedule": "CTA", "getstarted": "CTA",
        // Contact info → ContactForm
        "contactinfo": "ContactForm", "contactdetails": "ContactForm",
        "reachout": "ContactForm", "getintouch": "ContactForm",
        // Insurance/patient info → Features
        "insurance": "Features", "insuranceaccepted": "Features",
        "patientinfo": "Features", "patientresources": "Features",
        "resources": "Features", "information": "Features",
        // Process/steps → Features
        "process": "Features", "howwework": "Features", "howitworks": "Features",
        "steps": "Features", "workflow": "Features",
        // Social proof → SocialProof
        "socialproof": "SocialProof", "reviews": "Testimonials",
        "clientreviews": "Testimonials", "customerreviews": "Testimonials",
        // Map → Map
        "map": "Map", "mapembed": "Map", "googlemaps": "Map",
        "mapsection": "Map", "locationmap": "Map",
        // Video → Video
        "video": "Video", "videoplayer": "Video", "videosection": "Video",
        // Menu (restaurant) → Features
        "menu": "Features", "menulist": "Features", "foodmenu": "Features",
        // Banner/announcement → AnnouncementBar
        "banner": "AnnouncementBar", "announcement": "AnnouncementBar",
        // Comparison → ComparisonTable
        "comparison": "ComparisonTable", "compare": "ComparisonTable",
      };
      
      const normalizedKey = resolvedType.toLowerCase().replace(/[^a-z]/g, '');
      if (semanticMap[normalizedKey]) {
        console.log(`[Converter] Semantic match: "${resolvedType}" → "${semanticMap[normalizedKey]}"`);
        resolvedType = semanticMap[normalizedKey];
      } else {
        console.warn(`[Converter] ⚠️ Unknown component type: "${genComponent.type}" → "${resolvedType}" — passing through as-is`);
      }
    }
  }

  // First, fix all links in the props
  const fixedProps = fixLinksInObject(genComponent.props || {});
  
  // Transform props to match Studio component expectations
  const studioProps = transformPropsForStudio(resolvedType, fixedProps);
  
  // Handle LogoCloud→Features conversion (when no real images available)
  const finalType = studioProps.__convertedToFeatures ? "Features" : resolvedType;
  if (studioProps.__convertedToFeatures) {
    delete studioProps.__convertedToFeatures;
  }

  return {
    id: genComponent.id || nanoid(10),
    type: finalType,
    props: studioProps,
    parentId: "root",
  };
}

/**
 * Transform AI-generated props to match Studio component field expectations
 * 
 * CRITICAL: This converter ensures proper defaults for:
 * - Hero overlays (readability on images)
 * - Navbar scroll behavior  
 * - Consistent styling
 * - Mobile-friendly configurations
 * - Valid links (no placeholders!)
 */
function transformPropsForStudio(
  type: string,
  props: Record<string, unknown>
): Record<string, unknown> {

  // ==========================================================================
  // AI-FIRST CONVERTER (Phase AWD-10)
  //
  // Philosophy: The AI is the designer. We are the translator.
  // - ...props spread passes ALL AI decisions through untouched
  // - Field name normalization only (AI says "headline", component needs "title")
  // - Array structuring (normalize item shapes)
  // - Link validation (fixLink prevents "#" placeholders)
  // - Placeholder filtering (remove "hello@company.com" fake data)
  // - Overlay enforcement (background images need overlay for readability)
  // - Navbar scroll behavior (sticky + hideOnScroll is UX, not design)
  // ==========================================================================

  // Hero component
  if (type === "Hero") {
    const hasBackgroundImage = !!(props.backgroundImage || props.image);
    const ctaText = String(props.ctaText || props.buttonText || props.primaryButtonText || "Get Started");

    return {
      ...props,
      // Field name normalization
      title: props.headline || props.title || "Welcome",
      subtitle: props.subheadline || props.subtitle || "",
      description: props.description || props.subheadline || props.subtitle || "",
      primaryButtonText: ctaText,
      primaryButtonLink: fixLink(
        String(props.ctaLink || props.buttonLink || props.primaryButtonLink || ""),
        ctaText
      ),
      secondaryButtonLink: fixLink(
        String(props.secondaryButtonLink || props.secondaryCtaLink || ""),
        String(props.secondaryButtonText || "")
      ),
      contentAlign: props.alignment || props.contentAlign || props.contentAlign,
      // CRITICAL: Always add overlay when there's a background image for text readability
      backgroundOverlay: hasBackgroundImage ? true : (props.backgroundOverlay ?? false),
      backgroundOverlayOpacity: hasBackgroundImage ? (props.backgroundOverlayOpacity || 70) : (props.backgroundOverlayOpacity || 0),
      // Split variant image
      image: props.image || props.heroImage || "",
      imageAlt: props.imageAlt || "",
    };
  }

  // Navbar component — KEEP scroll behavior enforcement (UX, not design)
  if (type === "Navbar") {
    const links = props.links || props.navItems || props.navLinks || props.navigation || [];
    const ctaText = String(props.ctaText || props.buttonText || "Contact Us");

    return {
      ...props,
      // Logo normalization
      logoText: props.logoText || props.brandName || "Brand",
      logo: props.logo || props.logoImage || "",
      logoLink: "/",
      // Links — ensure properly formatted with valid routes
      links: Array.isArray(links) ? links.map((link: Record<string, unknown>) => ({
        label: link.label || link.text || link.name || "",
        href: fixLink(String(link.href || link.url || link.link || ""), String(link.label || link.text || "")),
        target: link.isExternal ? "_blank" : (link.target || "_self"),
      })) : [],
      // CTA link validation
      ctaText,
      ctaLink: fixLink(String(props.ctaLink || props.buttonLink || ""), ctaText),
      // CRITICAL: Scroll behavior for better UX (not a design decision)
      position: "sticky",
      hideOnScroll: true,
      showOnScrollUp: true,
      // Layout normalization — PremiumNavbarRender uses 'layout', AI might use 'variant'
      layout: (() => {
        const v = String(props.variant || props.layout || "standard").toLowerCase();
        const layoutMap: Record<string, string> = {
          "modern": "standard", "minimal": "minimal", "classic": "standard",
          "transparent": "standard", "centered": "centered", "split": "split",
        };
        return layoutMap[v] || v;
      })(),
      showCtaInMobileMenu: true,
      // Color prop passthrough — brand the navbar CTA and mobile menu
      ctaColor: props.ctaColor || undefined,
      ctaTextColor: props.ctaTextColor || undefined,
      mobileMenuBackground: props.mobileMenuBackground || undefined,
      mobileMenuTextColor: props.mobileMenuTextColor || undefined,
    };
  }

  // Features component
  if (type === "Features") {
    const features = props.features || props.items || [];
    return {
      ...props,
      title: props.headline || props.title || "Features",
      subtitle: props.subtitle || "",
      description: props.description || "",
      features: Array.isArray(features) ? features.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        title: f.title || f.name || `Feature ${i + 1}`,
        description: f.description || f.content || "",
        icon: f.icon || "star",
        iconColor: f.iconColor || props.iconColor,
        iconBackgroundColor: f.iconBackgroundColor,
      })) : [],
    };
  }

  // CTA component — Studio uses 'buttonText' NOT 'ctaText'
  if (type === "CTA") {
    const buttonText = String(props.ctaText || props.buttonText || "Contact Us");
    // CRITICAL: Ensure buttonTextColor always contrasts with buttonColor.
    // Default buttonColor is #ffffff (white) in CTARender, so we need dark text.
    // If AI set backgroundColor but not buttonTextColor, derive from backgroundColor.
    const resolvedButtonTextColor = props.buttonTextColor 
      || (props.backgroundColor && props.backgroundColor !== "#ffffff" && props.backgroundColor !== "#FFFFFF" 
          ? String(props.backgroundColor) : undefined)
      || "#1f2937"; // Safe dark fallback — never invisible
    return {
      ...props,
      title: props.headline || props.title || "Ready to Get Started?",
      subtitle: props.subtitle || "",
      description: props.description || "",
      buttonText,
      buttonTextColor: resolvedButtonTextColor,
      buttonLink: fixLink(String(props.ctaLink || props.buttonLink || ""), buttonText),
      secondaryButtonLink: fixLink(
        String(props.secondaryButtonLink || props.secondaryCtaLink || ""),
        String(props.secondaryButtonText || "")
      ),
    };
  }

  // Testimonials component
  if (type === "Testimonials") {
    const testimonials = props.testimonials || props.items || [];
    return {
      ...props,
      title: props.headline || props.title || "What Our Customers Say",
      subtitle: props.subtitle || "",
      description: props.description || "",
      testimonials: Array.isArray(testimonials) ? testimonials.map((t: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        quote: t.quote || t.text || t.content || "",
        author: t.author || t.name || `Customer ${i + 1}`,
        role: t.role || t.title || t.position || "",
        company: t.company || t.organization || "",
        image: t.avatar || t.image || "",
        rating: t.rating ?? 5,
      })) : [],
    };
  }

  // Team component
  if (type === "Team") {
    const members = props.members || props.team || props.items || [];
    return {
      ...props,
      title: props.headline || props.title || "Meet Our Team",
      subtitle: props.subtitle || "",
      description: props.description || "",
      members: Array.isArray(members) ? members.map((m: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        name: m.name || `Team Member ${i + 1}`,
        role: m.role || m.title || m.position || "",
        bio: m.bio || m.description || "",
        image: m.avatar || m.image || "",
        linkedin: m.linkedin || "",
        twitter: m.twitter || "",
        instagram: m.instagram || "",
        email: m.email || "",
      })) : [],
    };
  }

  // ContactForm component
  if (type === "ContactForm") {
    const fields = Array.isArray(props.fields) ? props.fields as string[] : ["name", "email", "message"];
    return {
      ...props,
      title: props.title || props.headline || "Contact Us",
      subtitle: props.subtitle || "",
      description: props.description || "",
      // Render uses boolean flags, not a fields array
      showPhone: props.showPhone ?? fields.includes("phone"),
      showSubject: props.showSubject ?? fields.includes("subject"),
      submitText: props.submitText || props.submitButtonText || props.buttonText || "Send Message",
      successMessage: props.successMessage || "Thank you for your message!",
    };
  }

  // Footer component
  if (type === "Footer") {
    const linkColumns = props.columns || props.sections || props.linkColumns || [];
    const socialLinks = props.socialLinks || props.social || [];

    return {
      ...props,
      // Branding
      companyName: props.companyName || props.businessName || props.logoText || "",
      logo: typeof props.logo === "string" && props.logo.includes("/") ? props.logo : "",
      logoText: props.logoText || props.companyName || props.businessName || "",
      description: (() => {
        // Filter out generic AI-fabricated descriptions
        const desc = String(props.description || props.tagline || "");
        const genericPatterns = [/technology services by/i, /innovative solutions/i, /professional business/i, /your trusted partner/i];
        if (genericPatterns.some(p => p.test(desc))) return "";
        return desc;
      })(),
      // Link columns
      columns: Array.isArray(linkColumns) ? linkColumns.map((col: Record<string, unknown>, i: number) => ({
        title: col.title || col.heading || `Column ${i + 1}`,
        links: Array.isArray(col.links) ? col.links.map((link: Record<string, unknown>) => {
          const label = String(link.label || link.text || link.name || "");
          return {
            label,
            href: fixLink(String(link.href || link.url || ""), label),
          };
        }) : [],
      })) : [],
      // Social links (external URLs — don't fix)
      showSocialLinks: Array.isArray(socialLinks) && socialLinks.length > 0,
      socialLinks: Array.isArray(socialLinks) ? socialLinks.map((social: Record<string, unknown>) => ({
        platform: social.platform || social.name || "facebook",
        url: social.url || social.href || social.link || "#",
      })) : [],
      // Contact info — filter out generic placeholders the AI fabricates
      showContactInfo: (() => {
        const email = props.email || props.contactEmail || "";
        const phone = props.phone || props.contactPhone || "";
        const address = props.address || props.contactAddress || "";
        const isPlaceholder = (v: unknown) => {
          const s = String(v || "").toLowerCase();
          return !s || s.includes("555") || s.includes("hello@company") || s.includes("123 main") ||
            s.includes("info@company") || s.includes("your@email") || s.includes("example.com") ||
            s.includes("xxx") || s.includes("000-000") || s.includes("main street") ||
            s.includes("city, country") || s.includes("city, state") || s.includes("any street") ||
            s.includes("@yourbusiness") || s.includes("@business") || s.includes("lorem") ||
            s.includes("(000)") || s.includes("000 000") || /\d{3}[\s-]?\d{3}[\s-]?\d{3,4}/.test(s) === false && s.length > 3 && /\d/.test(s);
        };
        return !isPlaceholder(email) || !isPlaceholder(phone) || !isPlaceholder(address);
      })(),
      contactEmail: (() => {
        const e = String(props.email || props.contactEmail || "");
        return /hello@company|info@company|your@|example\.com|@yourbusiness|@business\./i.test(e) ? "" : e;
      })(),
      contactPhone: (() => {
        const p = String(props.phone || props.contactPhone || "");
        return /555|97X|\(555\)|\(000\)|000-000|000 000/i.test(p) ? "" : p;
      })(),
      contactAddress: (() => {
        const a = String(props.address || props.contactAddress || "");
        return /123 main|main street|any street|city,?\s*(country|state)|lorem/i.test(a) ? "" : a;
      })(),
      // Copyright & Legal
      copyright: props.copyrightText || props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
      // CRITICAL: PremiumFooterRender expects 'bottomLinks' NOT 'legalLinks'
      bottomLinks: props.bottomLinks || props.legalLinks || [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookies", href: "/cookies" },
      ],
    };
  }

  // FAQ component
  if (type === "FAQ") {
    const faqs = props.faqs || props.items || props.questions || props.faqItems || props.faq_items || [];
    return {
      ...props,
      title: props.headline || props.title || "Frequently Asked Questions",
      subtitle: props.subtitle || "",
      description: props.description || "",
      items: Array.isArray(faqs) ? faqs.map((f: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        question: f.question || f.title || `Question ${i + 1}`,
        answer: f.answer || f.content || f.response || "",
      })) : [],
      // Expand the first FAQ item by default for better UX
      defaultOpen: 0,
    };
  }

  // Stats component
  if (type === "Stats") {
    const stats = props.stats || props.items || [];
    return {
      ...props,
      title: props.headline || props.title || "",
      subtitle: props.subtitle || "",
      description: props.description || "",
      stats: Array.isArray(stats) ? stats.map((s: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        value: s.value || s.number || "0",
        label: s.label || s.title || s.name || `Stat ${i + 1}`,
        description: s.description || "",
        suffix: s.suffix || "",
        prefix: s.prefix || "",
        icon: s.icon || "",
        iconColor: s.iconColor || "",
      })) : [],
    };
  }

  // Pricing component
  if (type === "Pricing") {
    const plans = props.plans || props.tiers || props.items || [];
    return {
      ...props,
      title: props.headline || props.title || "Pricing",
      subtitle: props.subtitle || "",
      description: props.description || "",
      plans: Array.isArray(plans) ? plans.map((p: Record<string, unknown>, i: number) => {
        const btnText = String(p.ctaText || p.buttonText || "Get Started");
        return {
          id: String(i + 1),
          name: p.name || p.title || `Plan ${i + 1}`,
          description: p.description || "",
          price: p.price || p.monthlyPrice || "0",
          currency: p.currency || "USD",
          period: p.period || "month",
          features: Array.isArray(p.features) ? p.features.map((f: unknown) => {
            if (typeof f === "string") return { text: f, included: true };
            if (typeof f === "object" && f !== null) {
              const feat = f as Record<string, unknown>;
              return { text: feat.text || feat.name || "", included: feat.included ?? true };
            }
            return { text: String(f), included: true };
          }) : [],
          buttonText: btnText,
          buttonLink: fixLink(String(p.ctaLink || p.buttonLink || ""), btnText),
          popular: p.highlighted || p.featured || p.popular || false,
        };
      }) : [],
    };
  }

  // Section wrapper
  if (type === "Section") {
    return {
      ...props,
      padding: props.padding || "md",
    };
  }

  // Text/RichText
  if (type === "Text" || type === "RichText") {
    return {
      ...props,
      content: props.content || props.text || props.body || "",
    };
  }

  // Heading
  if (type === "Heading") {
    return {
      ...props,
      text: props.text || props.title || props.content || "",
    };
  }

  // Divider component
  if (type === "Divider") {
    return { ...props };
  }

  // Spacer component
  if (type === "Spacer") {
    return {
      ...props,
      size: props.size || props.height || "md",
    };
  }

  // Gallery component
  if (type === "Gallery") {
    const images = props.images || props.items || props.gallery || [];
    return {
      ...props,
      title: props.title || props.headline || "Gallery",
      subtitle: props.subtitle || "",
      description: props.description || "",
      images: Array.isArray(images) ? images.map((img: Record<string, unknown>, i: number) => ({
        id: String(i + 1),
        src: img.src || img.url || img.image || "",
        alt: img.alt || img.caption || img.title || `Image ${i + 1}`,
        title: img.title || "",
        caption: img.caption || "",
        category: img.category || "",
      })) : [],
    };
  }

  // Newsletter component
  if (type === "Newsletter") {
    return {
      ...props,
      title: props.title || props.headline || "Stay Updated",
      description: props.description || props.subtitle || "Subscribe to our newsletter for the latest updates.",
      buttonText: props.buttonText || props.ctaText || props.submitText || "Subscribe",
      placeholder: props.placeholder || "Enter your email",
    };
  }

  // LogoCloud component
  if (type === "LogoCloud") {
    const logos = props.logos || props.items || props.brands || props.partners || [];
    // Filter out logos with no image URL — prevents broken images in production
    const processedLogos = Array.isArray(logos) ? logos.map((logo: Record<string, unknown>, i: number) => ({
      image: logo.image || logo.src || logo.logo || logo.url || "",
      alt: logo.alt || logo.name || `Partner ${i + 1}`,
      link: logo.link || logo.url || logo.href || "",
    })).filter((logo: { image: string }) => {
      // Only include logos that have a real image URL
      return logo.image && (logo.image.startsWith("http") || logo.image.startsWith("/") || logo.image.startsWith("data:"));
    }) : [];
    
    // If no logos have real image URLs, convert this to a text-based component
    // by returning a Features component with the logo names as feature items
    if (processedLogos.length === 0 && Array.isArray(logos) && logos.length > 0) {
      // No real images — render as text-based trust indicators using Features
      return {
        ...props,
        title: props.title || props.headline || "Trusted By",
        subtitle: props.subtitle || "",
        description: props.description || "",
        // Convert logo names to feature items with shield icons
        features: logos.map((logo: Record<string, unknown>, i: number) => ({
          id: String(i + 1),
          title: String(logo.alt || logo.name || logo.text || `Partner ${i + 1}`),
          description: "",
          icon: "🛡️",
        })),
        __convertedToFeatures: true, // Signal for the caller
      };
    }
    
    return {
      ...props,
      title: props.title || props.headline || "Trusted By",
      subtitle: props.subtitle || "",
      description: props.description || "",
      logos: processedLogos,
      // CRITICAL: Render expects responsive columns object, not a single number
      columns: typeof props.columns === "object" ? props.columns : {
        mobile: 2,
        tablet: Math.min(Number(props.columns) || 5, 4),
        desktop: Number(props.columns) || 5,
      },
      // CRITICAL: Render expects 'grayscale' NOT 'logoGrayscale'
      grayscale: props.grayscale ?? props.logoGrayscale ?? true,
      hoverColor: props.hoverColor ?? !(props.logoGrayscaleHover ?? false),
      // CRITICAL: Render expects 'background' NOT 'backgroundColor'
      background: props.background || props.backgroundColor || "",
    };
  }

  // TrustBadges component
  if (type === "TrustBadges") {
    const badges = props.badges || props.items || [];
    return {
      ...props,
      title: props.title || props.headline || "",
      badges: Array.isArray(badges) ? badges.map((b: Record<string, unknown>, i: number) => {
        const text = String(b.text || b.title || b.label || b.alt || b.name || `Badge ${i + 1}`);
        const image = String(b.image || b.icon || "");
        // If the "image" is actually a short emoji or icon name (not a URL), use as icon
        // If no real image URL, use shield emoji as default icon
        const isRealImageUrl = image.startsWith("http") || image.startsWith("/") || image.startsWith("data:");
        return {
          icon: isRealImageUrl ? "🛡️" : (image || "🛡️"),
          text,
          description: String(b.description || b.tooltip || ""),
          image: isRealImageUrl ? image : "", // Only pass real URLs
          link: b.link || b.href || "",
          featured: b.featured || false,
        };
      }) : [],
      // Use 'pills' variant when no real images — looks better than broken images
      variant: props.variant || props.layout || "pills",
    };
  }

  // Quote component
  if (type === "Quote") {
    return {
      ...props,
      text: props.text || props.quote || props.content || "",
      author: props.author || props.attribution || "",
      // CRITICAL: Render expects 'authorTitle' NOT 'source'
      authorTitle: props.authorTitle || props.source || props.role || props.company || "",
      authorImage: props.authorImage || props.avatar || props.image || "",
      // CRITICAL: Render expects 'variant' NOT 'style'
      variant: props.variant || props.style || "bordered",
    };
  }

  // ==========================================================================
  // MODULE COMPONENT HANDLERS
  // Booking & E-commerce: keep containment props (prevent edge-to-edge stretch)
  // ==========================================================================

  const MODULE_TYPES = [
    // Booking module — all 6
    "BookingServiceSelector", "BookingWidget", "BookingCalendar",
    "BookingForm", "BookingEmbed", "BookingStaffGrid",
    // E-commerce module — all 22
    "EcommerceProductGrid", "EcommerceProductCard", "EcommerceProductCatalog",
    "EcommerceFeaturedProducts", "EcommerceCartPage", "EcommerceCartDrawer",
    "EcommerceMiniCart", "EcommerceCheckoutPage", "EcommerceOrderConfirmation",
    "EcommerceCategoryNav", "EcommerceSearchBar", "EcommerceFilterSidebar",
    "EcommerceBreadcrumb", "EcommerceProductSort",
    "EcommerceQuoteRequest", "EcommerceQuoteList", "EcommerceQuoteDetail",
    "EcommerceReviewForm", "EcommerceReviewList",
    "ProductDetailBlock", "CategoryHeroBlock",
  ];

  if (MODULE_TYPES.includes(type)) {
    return {
      ...props,
      // Containment — prevent edge-to-edge stretching
      maxWidth: props.maxWidth || "1280px",
      containerClassName: props.containerClassName || "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8",
      sectionPaddingY: props.sectionPaddingY || "py-12 md:py-16",
      sectionPaddingX: props.sectionPaddingX || "px-4 sm:px-6 lg:px-8",
    };
  }

  // Return original props for unknown types — AI decisions pass through
  return { ...props };
}

/**
 * Convert entire WebsiteDesignerOutput to a map of page slug -> StudioPageData
 * 
 * This function sets the page slugs internally before conversion
 * to ensure all links are validated consistently.
 * 
 * @param output - The AI-generated website output
 */
export function convertOutputToStudioPages(
  output: WebsiteDesignerOutput,
): Map<string, { page: GeneratedPage; studioData: StudioPageData }> {
  // Set page slugs BEFORE conversion for link validation (thread-safe per call)
  const allSlugs = output.pages.map(p => p.slug.startsWith('/') ? p.slug : `/${p.slug}`);
  generatedPageSlugs = allSlugs;
  
  const result = new Map<string, { page: GeneratedPage; studioData: StudioPageData }>();

  for (const page of output.pages) {
    const studioData = convertPageToStudioFormat(page);
    result.set(page.slug, { page, studioData });
  }

  return result;
}

/**
 * Get default empty Studio data
 */
export function getEmptyStudioData(): StudioPageData {
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: {},
      children: [],
    },
    components: {},
    zones: {},
  };
}
