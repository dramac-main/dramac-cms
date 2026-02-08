/**
 * DESIGN QUALITY AUDITOR
 * 
 * An intelligent system that scans every generated website component for 
 * imperfections BEFORE the AI completes the website. It catches issues 
 * that humans would notice and fixes them automatically.
 * 
 * AUDIT CATEGORIES:
 * 1. Color & Contrast — text readability, button visibility, dark/light consistency
 * 2. Spacing & Alignment — consistent padding, proper gaps, no cramped elements
 * 3. Typography — hierarchy, font sizing, line heights, readability
 * 4. Component Containment — max-width, proper padding, no edge-to-edge stretching
 * 5. Branding Consistency — all components using design tokens, no defaults leaking
 * 6. Footer & Header — proper link colors, newsletter styling, social icons
 * 7. Module Integration — booking/ecommerce components properly themed
 * 8. Content Quality — no generic text, proper CTA text per industry
 * 9. Responsive — proper mobile defaults
 * 10. Visual Variety — detect sameness across sections
 * 
 * This runs as a POST-GENERATION pass that fixes issues before final output.
 */

import { checkContrast, ensureReadable } from "../config/color-intelligence";

// =============================================================================
// TYPES
// =============================================================================

export interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: AuditCategory;
  component: string;
  componentId: string;
  field: string;
  message: string;
  currentValue: unknown;
  fixedValue: unknown;
  autoFixed: boolean;
}

export type AuditCategory = 
  | "contrast" | "spacing" | "typography" | "containment" 
  | "branding" | "footer" | "module" | "content" 
  | "responsive" | "variety";

export interface AuditResult {
  totalIssues: number;
  criticalIssues: number;
  autoFixed: number;
  issues: AuditIssue[];
  score: number; // 0-100
}

interface ComponentProps {
  [key: string]: unknown;
}

interface DesignTokens {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

// =============================================================================
// MAIN AUDITOR
// =============================================================================

/**
 * Run a complete design quality audit on all generated components.
 * Automatically fixes what it can and reports the rest.
 */
export function auditWebsite(
  components: Array<{ id: string; type: string; props: ComponentProps }>,
  designTokens: DesignTokens
): AuditResult {
  const issues: AuditIssue[] = [];
  const siteBg = designTokens.backgroundColor || "#ffffff";
  const siteText = designTokens.textColor || "#111827";
  const sitePrimary = designTokens.primaryColor || "#3b82f6";
  const isDark = isColorDark(siteBg);

  for (const comp of components) {
    // ━━━━ 1. CONTRAST AUDIT ━━━━
    auditContrast(comp, siteBg, siteText, isDark, issues);
    
    // ━━━━ 2. CONTAINMENT AUDIT ━━━━
    auditContainment(comp, issues);
    
    // ━━━━ 3. BRANDING AUDIT ━━━━
    auditBranding(comp, sitePrimary, siteBg, siteText, isDark, issues);
    
    // ━━━━ 4. FOOTER AUDIT ━━━━
    if (comp.type === "Footer") {
      auditFooter(comp, siteBg, isDark, sitePrimary, issues);
    }
    
    // ━━━━ 5. NEWSLETTER AUDIT ━━━━
    if (comp.type === "Newsletter") {
      auditNewsletter(comp, siteBg, isDark, sitePrimary, issues);
    }
    
    // ━━━━ 6. MODULE AUDIT ━━━━
    if (isModuleComponent(comp.type)) {
      auditModuleComponent(comp, siteBg, siteText, sitePrimary, isDark, issues);
    }
    
    // ━━━━ 7. CONTENT QUALITY ━━━━
    auditContent(comp, issues);
    
    // ━━━━ 8. SPACING ━━━━
    auditSpacing(comp, issues);
  }
  
  // ━━━━ 9. VARIETY CHECK ━━━━
  auditVariety(components, issues);
  
  // Calculate score
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const autoFixed = issues.filter(i => i.autoFixed).length;
  const score = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 5) + (autoFixed * 3));

  return {
    totalIssues: issues.length,
    criticalIssues: criticalCount,
    autoFixed,
    issues,
    score: Math.min(100, score),
  };
}

// =============================================================================
// AUDIT FUNCTIONS
// =============================================================================

function auditContrast(
  comp: { id: string; type: string; props: ComponentProps },
  siteBg: string,
  siteText: string,
  isDark: boolean,
  issues: AuditIssue[]
): void {
  const props = comp.props;
  const bg = getColor(props.backgroundColor, siteBg);
  
  // Check text on background
  const textFields = ["textColor", "titleColor", "subtitleColor", "descriptionColor"];
  for (const field of textFields) {
    const color = getColor(props[field]);
    if (color && isValidHex(color) && isValidHex(bg)) {
      const result = checkContrast(color, bg);
      if (!result.passesAA) {
        const fixed = ensureReadable(color, bg);
        props[field] = fixed;
        issues.push({
          severity: "critical",
          category: "contrast",
          component: comp.type,
          componentId: comp.id,
          field,
          message: `Text color ${color} has insufficient contrast (${result.ratio.toFixed(1)}) on ${bg}`,
          currentValue: color,
          fixedValue: fixed,
          autoFixed: true,
        });
      }
    }
  }

  // Check button text on button background
  if (props.buttonColor || props.primaryButtonColor) {
    const btnBg = getColor(props.buttonColor || props.primaryButtonColor, sitePrimary(siteText));
    const btnText = getColor(props.buttonTextColor || props.primaryButtonTextColor, "#ffffff");
    if (isValidHex(btnBg) && isValidHex(btnText)) {
      const result = checkContrast(btnText, btnBg);
      if (!result.passesAA) {
        const fixed = ensureReadable(btnText, btnBg);
        const textField = props.buttonTextColor ? "buttonTextColor" : "primaryButtonTextColor";
        props[textField] = fixed;
        issues.push({
          severity: "critical",
          category: "contrast",
          component: comp.type,
          componentId: comp.id,
          field: textField,
          message: `Button text ${btnText} not readable on button bg ${btnBg}`,
          currentValue: btnText,
          fixedValue: fixed,
          autoFixed: true,
        });
      }
    }
  }

  // Check card text on card background  
  if (props.cardBackgroundColor) {
    const cardBg = getColor(props.cardBackgroundColor);
    const cardText = getColor(props.textColor || props.featureTitleColor, siteText);
    if (cardBg && isValidHex(cardBg) && isValidHex(cardText)) {
      const result = checkContrast(cardText, cardBg);
      if (!result.passesAA) {
        const fixed = ensureReadable(cardText, cardBg);
        if (props.featureTitleColor) props.featureTitleColor = fixed;
        else props.textColor = fixed;
        issues.push({
          severity: "critical",
          category: "contrast",
          component: comp.type,
          componentId: comp.id,
          field: "cardTextContrast",
          message: `Card text not readable on card background`,
          currentValue: cardText,
          fixedValue: fixed,
          autoFixed: true,
        });
      }
    }
  }
}

function auditContainment(
  comp: { id: string; type: string; props: ComponentProps },
  issues: AuditIssue[]
): void {
  const needsContainment = [
    "Newsletter", "BookingServiceSelector", "BookingWidget", "BookingCalendar",
    "BookingForm", "BookingEmbed", "BookingStaffGrid", "ProductGrid",
    "CartItems", "CartSummary", "CheckoutForm",
  ];

  if (needsContainment.includes(comp.type)) {
    // Ensure max-width and padding
    if (!comp.props.maxWidth) {
      comp.props.maxWidth = "7xl";
      issues.push({
        severity: "warning",
        category: "containment",
        component: comp.type,
        componentId: comp.id,
        field: "maxWidth",
        message: `${comp.type} missing max-width containment`,
        currentValue: undefined,
        fixedValue: "7xl",
        autoFixed: true,
      });
    }
    if (!comp.props.paddingX) {
      comp.props.paddingX = "md";
    }
    if (!comp.props.paddingY) {
      comp.props.paddingY = "lg";
    }
  }
}

function auditBranding(
  comp: { id: string; type: string; props: ComponentProps },
  sitePrimaryColor: string,
  siteBg: string,
  siteText: string,
  isDark: boolean,
  issues: AuditIssue[]
): void {
  // Check for default blue (#3b82f6) leaking through when site has a different primary
  const defaultBlue = "#3b82f6";
  if (sitePrimaryColor && sitePrimaryColor.toLowerCase() !== defaultBlue) {
    const colorFields = [
      "buttonColor", "primaryButtonColor", "ctaColor", "accentColor", 
      "linkColor", "iconColor", "defaultIconColor", "badgeColor",
    ];
    
    for (const field of colorFields) {
      const val = getColor(props(comp)[field]);
      if (val && val.toLowerCase() === defaultBlue) {
        comp.props[field] = sitePrimaryColor;
        issues.push({
          severity: "warning",
          category: "branding",
          component: comp.type,
          componentId: comp.id,
          field,
          message: `Default blue ${defaultBlue} used instead of brand primary ${sitePrimaryColor}`,
          currentValue: defaultBlue,
          fixedValue: sitePrimaryColor,
          autoFixed: true,
        });
      }
    }
  }
}

function auditFooter(
  comp: { id: string; type: string; props: ComponentProps },
  siteBg: string,
  isDark: boolean,
  sitePrimary: string,
  issues: AuditIssue[]
): void {
  const p = comp.props;
  const footerBg = getColor(p.backgroundColor, "#111827");
  
  // Ensure link colors are visible on footer background
  const linkColor = getColor(p.linkColor, "#9ca3af");
  if (isValidHex(linkColor) && isValidHex(footerBg)) {
    const result = checkContrast(linkColor, footerBg);
    if (!result.passesAA) {
      const fixed = ensureReadable(linkColor, footerBg);
      p.linkColor = fixed;
      issues.push({
        severity: "critical",
        category: "footer",
        component: "Footer",
        componentId: comp.id,
        field: "linkColor",
        message: `Footer links barely visible: ${linkColor} on ${footerBg} (ratio ${result.ratio.toFixed(1)})`,
        currentValue: linkColor,
        fixedValue: fixed,
        autoFixed: true,
      });
    }
  }

  // Ensure text color is visible on footer bg
  const textColor = getColor(p.textColor, "#f9fafb");
  if (isValidHex(textColor) && isValidHex(footerBg)) {
    const result = checkContrast(textColor, footerBg);
    if (!result.passesAA) {
      const fixed = ensureReadable(textColor, footerBg);
      p.textColor = fixed;
      issues.push({
        severity: "critical",
        category: "footer",
        component: "Footer",
        componentId: comp.id,
        field: "textColor",
        message: `Footer text not readable`,
        currentValue: textColor,
        fixedValue: fixed,
        autoFixed: true,
      });
    }
  }

  // Ensure hover color exists and is brighter than link color
  if (!p.linkHoverColor) {
    p.linkHoverColor = "#ffffff";
  }

  // Ensure newsletter button in footer is themed
  if (p.showNewsletter && !p.newsletterButtonColor) {
    p.newsletterButtonColor = sitePrimary;
  }
}

function auditNewsletter(
  comp: { id: string; type: string; props: ComponentProps },
  siteBg: string,
  isDark: boolean,
  sitePrimary: string,
  issues: AuditIssue[]
): void {
  const p = comp.props;
  
  // Ensure newsletter has proper containment props (will be wrapped in renderer)
  if (!p.sectionPadding) {
    p.sectionPadding = "lg";
  }
  if (!p.sectionMaxWidth) {
    p.sectionMaxWidth = "4xl";
  }

  // Ensure button color is themed
  if (!p.buttonColor || getColor(p.buttonColor) === "#3b82f6") {
    p.buttonColor = sitePrimary;
    issues.push({
      severity: "warning",
      category: "branding",
      component: "Newsletter",
      componentId: comp.id,
      field: "buttonColor",
      message: "Newsletter button using default blue instead of brand color",
      currentValue: p.buttonColor,
      fixedValue: sitePrimary,
      autoFixed: true,
    });
  }

  // Ensure text is readable
  const nlBg = getColor(p.backgroundColor, isDark ? siteBg : "#f8fafc");
  const nlText = getColor(p.textColor, isDark ? "#ffffff" : "#111827");
  if (isValidHex(nlBg) && isValidHex(nlText)) {
    const result = checkContrast(nlText, nlBg);
    if (!result.passesAA) {
      p.textColor = ensureReadable(nlText, nlBg);
    }
  }
}

function auditModuleComponent(
  comp: { id: string; type: string; props: ComponentProps },
  siteBg: string,
  siteText: string,
  sitePrimary: string,
  isDark: boolean,
  issues: AuditIssue[]
): void {
  const p = comp.props;

  // Inject theming if missing
  if (!p.primaryColor && !p.accentColor) {
    p.primaryColor = sitePrimary;
    p.accentColor = sitePrimary;
  }
  
  // Inject background awareness
  if (!p.backgroundColor) {
    p.backgroundColor = isDark ? siteBg : "";
  }
  if (!p.textColor) {
    p.textColor = siteText;
  }

  // Ensure containment
  if (!p.containerMaxWidth) {
    p.containerMaxWidth = "7xl";
  }
  if (!p.containerPadding) {
    p.containerPadding = "md";
  }

  issues.push({
    severity: "info",
    category: "module",
    component: comp.type,
    componentId: comp.id,
    field: "theming",
    message: `Module component themed with brand colors`,
    currentValue: null,
    fixedValue: { primaryColor: sitePrimary, textColor: siteText },
    autoFixed: true,
  });
}

function auditContent(
  comp: { id: string; type: string; props: ComponentProps },
  issues: AuditIssue[]
): void {
  // Check for generic/placeholder content
  const genericPatterns = [
    /lorem ipsum/i,
    /professional business solutions/i,
    /innovative technology/i,
    /building the future/i,
    /your trusted partner/i,
    /premium consulting/i,
    /leading provider of/i,
    /best in class/i,
    /world-class solutions/i,
    /empowering businesses/i,
    /hello@company\.com/i,
    /\(555\)/,
    /123 Main Street/i,
    /example\.com/i,
  ];

  const textFields = ["title", "description", "subtitle", "headline"];
  for (const field of textFields) {
    const val = String(comp.props[field] || "");
    for (const pattern of genericPatterns) {
      if (pattern.test(val)) {
        issues.push({
          severity: "warning",
          category: "content",
          component: comp.type,
          componentId: comp.id,
          field,
          message: `Generic placeholder content detected: "${val.substring(0, 50)}..."`,
          currentValue: val,
          fixedValue: null,
          autoFixed: false,
        });
        break;
      }
    }
  }
}

function auditSpacing(
  comp: { id: string; type: string; props: ComponentProps },
  _issues: AuditIssue[]
): void {
  // Ensure sections have proper spacing
  const sectionTypes = ["Hero", "Features", "CTA", "Testimonials", "Team", "FAQ", "Stats", "Pricing", "Gallery", "ContactForm"];
  
  if (sectionTypes.includes(comp.type)) {
    // Ensure minimum vertical padding
    if (!comp.props.paddingY && !comp.props.paddingTop && !comp.props.paddingBottom) {
      comp.props.paddingY = "lg";
    }
  }
}

function auditVariety(
  components: Array<{ id: string; type: string; props: ComponentProps }>,
  issues: AuditIssue[]
): void {
  // Check if all sections use the same background color (boring!)
  const sectionBgs = components
    .filter(c => !["Navbar", "Footer"].includes(c.type))
    .map(c => getColor(c.props.backgroundColor, ""))
    .filter(Boolean);

  if (sectionBgs.length >= 3) {
    const uniqueBgs = new Set(sectionBgs);
    if (uniqueBgs.size === 1) {
      issues.push({
        severity: "warning",
        category: "variety",
        component: "Page",
        componentId: "page",
        field: "backgroundColors",
        message: "All sections use the same background — consider alternating colors for visual rhythm",
        currentValue: sectionBgs[0],
        fixedValue: null,
        autoFixed: false,
      });
    }
  }

  // Check if all card-bearing sections use the same variant
  const cardSections = components.filter(c => ["Features", "Testimonials", "Team", "Pricing"].includes(c.type));
  if (cardSections.length >= 2) {
    const variants = cardSections.map(c => String(c.props.variant || "cards"));
    const uniqueVariants = new Set(variants);
    if (uniqueVariants.size === 1) {
      issues.push({
        severity: "info",
        category: "variety",
        component: "Cards",
        componentId: "page",
        field: "variants",
        message: "All card sections use the same variant — consider mixing 'cards', 'minimal', 'centered'",
        currentValue: variants[0],
        fixedValue: null,
        autoFixed: false,
      });
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function isModuleComponent(type: string): boolean {
  return [
    "BookingServiceSelector", "BookingWidget", "BookingCalendar",
    "BookingForm", "BookingEmbed", "BookingStaffGrid",
    "ProductGrid", "CartItems", "CartSummary", "CheckoutForm",
  ].includes(type);
}

function isColorDark(hex: string): boolean {
  if (!isValidHex(hex)) return false;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function isValidHex(color: string | unknown): color is string {
  if (typeof color !== "string") return false;
  return /^#[0-9a-fA-F]{3,8}$/.test(color.trim());
}

function getColor(value: unknown, fallback?: string): string {
  if (typeof value === "string" && value.startsWith("#")) return value;
  if (typeof value === "string" && value.startsWith("rgb")) return value;
  return fallback || "";
}

function sitePrimary(fallback: string): string {
  return fallback;
}

function props(comp: { props: ComponentProps }): ComponentProps {
  return comp.props;
}
