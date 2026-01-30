/**
 * Accessibility Checker Service
 * 
 * WCAG-based accessibility analysis for page content.
 * Part of PHASE-ED-05C: AI Editor - Content Optimization
 */

import type { Data as PuckData, ComponentData } from "@puckeditor/core";

// ============================================
// Types
// ============================================

export type WCAGLevel = "A" | "AA" | "AAA";

export interface AccessibilityIssue {
  id: string;
  wcagCriteria: string;
  wcagLevel: WCAGLevel;
  severity: "critical" | "serious" | "moderate" | "minor";
  title: string;
  description: string;
  impact: string;
  howToFix: string;
  componentId?: string;
  componentType?: string;
  autoFixable: boolean;
  affectedElement?: string;
}

export interface AccessibilityResult {
  score: number;
  issues: AccessibilityIssue[];
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  passedChecks: string[];
  wcagCompliance: {
    A: boolean;
    AA: boolean;
    AAA: boolean;
  };
}

// ============================================
// WCAG Criteria Reference
// ============================================

const WCAG_CRITERIA = {
  // Level A
  "1.1.1": { level: "A" as WCAGLevel, name: "Non-text Content" },
  "1.3.1": { level: "A" as WCAGLevel, name: "Info and Relationships" },
  "1.3.2": { level: "A" as WCAGLevel, name: "Meaningful Sequence" },
  "1.4.1": { level: "A" as WCAGLevel, name: "Use of Color" },
  "2.4.1": { level: "A" as WCAGLevel, name: "Bypass Blocks" },
  "2.4.2": { level: "A" as WCAGLevel, name: "Page Titled" },
  "2.4.4": { level: "A" as WCAGLevel, name: "Link Purpose (In Context)" },
  "3.1.1": { level: "A" as WCAGLevel, name: "Language of Page" },
  "4.1.1": { level: "A" as WCAGLevel, name: "Parsing" },
  "4.1.2": { level: "A" as WCAGLevel, name: "Name, Role, Value" },
  
  // Level AA
  "1.4.3": { level: "AA" as WCAGLevel, name: "Contrast (Minimum)" },
  "1.4.4": { level: "AA" as WCAGLevel, name: "Resize Text" },
  "1.4.5": { level: "AA" as WCAGLevel, name: "Images of Text" },
  "2.4.6": { level: "AA" as WCAGLevel, name: "Headings and Labels" },
  "2.4.7": { level: "AA" as WCAGLevel, name: "Focus Visible" },
  "3.1.2": { level: "AA" as WCAGLevel, name: "Language of Parts" },
  
  // Level AAA
  "1.4.6": { level: "AAA" as WCAGLevel, name: "Contrast (Enhanced)" },
  "2.4.9": { level: "AAA" as WCAGLevel, name: "Link Purpose (Link Only)" },
  "2.4.10": { level: "AAA" as WCAGLevel, name: "Section Headings" },
};

// ============================================
// Extraction Utilities
// ============================================

function extractImages(puckData: PuckData): Array<{
  componentId?: string;
  componentType: string;
  src?: string;
  alt?: string;
  isDecorative?: boolean;
}> {
  const images: Array<{
    componentId?: string;
    componentType: string;
    src?: string;
    alt?: string;
    isDecorative?: boolean;
  }> = [];

  if (!puckData.content) return images;

  for (const component of puckData.content) {
    const props = component.props || {};
    
    // Check for image sources
    const srcFields = ["src", "image", "backgroundImage", "avatar", "logo"];
    for (const field of srcFields) {
      if (props[field]) {
        images.push({
          componentId: component.props?.id as string | undefined,
          componentType: component.type,
          src: props[field] as string,
          alt: props.alt as string | undefined,
          isDecorative: props.isDecorative as boolean | undefined,
        });
      }
    }

    // Check arrays
    const arrayFields = ["images", "gallery", "features", "team", "testimonials"];
    for (const field of arrayFields) {
      if (Array.isArray(props[field])) {
        for (const item of props[field] as Array<Record<string, unknown>>) {
          if (item && typeof item === "object") {
            for (const srcField of srcFields) {
              if (item[srcField]) {
                images.push({
                  componentId: component.props?.id as string | undefined,
                  componentType: component.type,
                  src: item[srcField] as string,
                  alt: item.alt as string | undefined,
                  isDecorative: item.isDecorative as boolean | undefined,
                });
              }
            }
          }
        }
      }
    }
  }

  return images;
}

function extractLinks(puckData: PuckData): Array<{
  componentId?: string;
  componentType: string;
  href?: string;
  text?: string;
  hasAriaLabel?: boolean;
}> {
  const links: Array<{
    componentId?: string;
    componentType: string;
    href?: string;
    text?: string;
    hasAriaLabel?: boolean;
  }> = [];

  if (!puckData.content) return links;

  for (const component of puckData.content) {
    const props = component.props || {};
    
    const linkFields = ["href", "url", "link", "ctaLink", "buttonLink"];
    for (const field of linkFields) {
      if (props[field]) {
        links.push({
          componentId: props.id as string | undefined,
          componentType: component.type,
          href: props[field] as string,
          text: (props.ctaText || props.buttonText || props.text || props.label) as string | undefined,
          hasAriaLabel: !!props.ariaLabel,
        });
      }
    }
  }

  return links;
}

function extractHeadings(puckData: PuckData): Array<{
  level: number;
  text: string;
  index: number;
}> {
  const headings: Array<{ level: number; text: string; index: number }> = [];

  if (!puckData.content) return headings;

  puckData.content.forEach((component, index) => {
    // Hero is typically H1
    if (component.type === "Hero") {
      headings.push({
        level: 1,
        text: (component.props?.title || component.props?.heading || "") as string,
        index,
      });
    }
    // Explicit Heading component
    if (component.type === "Heading") {
      headings.push({
        level: (component.props?.level || 2) as number,
        text: (component.props?.text || component.props?.content || "") as string,
        index,
      });
    }
    // Section headings
    if (component.type?.includes("Section") || component.type === "Features" || component.type === "Testimonials") {
      if (component.props?.title || component.props?.heading) {
        headings.push({
          level: 2,
          text: (component.props?.title || component.props?.heading) as string,
          index,
        });
      }
    }
  });

  return headings;
}

function extractFormFields(puckData: PuckData): Array<{
  componentType: string;
  hasLabel: boolean;
  hasPlaceholder: boolean;
  hasAriaLabel: boolean;
  fieldName?: string;
}> {
  const fields: Array<{
    componentType: string;
    hasLabel: boolean;
    hasPlaceholder: boolean;
    hasAriaLabel: boolean;
    fieldName?: string;
  }> = [];

  if (!puckData.content) return fields;

  for (const component of puckData.content) {
    if (["ContactForm", "Form", "Newsletter", "Input", "SearchBar"].includes(component.type)) {
      const props = component.props || {};
      
      // Check for form field configurations
      if (Array.isArray(props.fields)) {
        for (const field of props.fields as Array<Record<string, unknown>>) {
          fields.push({
            componentType: component.type,
            hasLabel: !!field.label,
            hasPlaceholder: !!field.placeholder,
            hasAriaLabel: !!field.ariaLabel,
            fieldName: field.name as string | undefined,
          });
        }
      } else {
        // Single field components
        fields.push({
          componentType: component.type,
          hasLabel: !!(props.label || props.inputLabel),
          hasPlaceholder: !!props.placeholder,
          hasAriaLabel: !!props.ariaLabel,
          fieldName: props.name as string | undefined,
        });
      }
    }
  }

  return fields;
}

// ============================================
// Check Functions
// ============================================

function checkImageAlternatives(puckData: PuckData): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = extractImages(puckData);
  let issueId = 0;

  for (const img of images) {
    if (!img.alt && !img.isDecorative) {
      issues.push({
        id: `a11y-img-${++issueId}`,
        wcagCriteria: "1.1.1",
        wcagLevel: "A",
        severity: "critical",
        title: "Image missing alternative text",
        description: `An image in ${img.componentType} component has no alt text.`,
        impact: "Screen reader users cannot understand the image content.",
        howToFix: "Add descriptive alt text or mark as decorative.",
        componentType: img.componentType,
        componentId: img.componentId,
        autoFixable: true,
        affectedElement: img.src,
      });
    }
  }

  return issues;
}

function checkHeadingStructure(puckData: PuckData): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings = extractHeadings(puckData);
  let issueId = 0;

  // Check for missing H1
  const h1s = headings.filter(h => h.level === 1);
  if (h1s.length === 0) {
    issues.push({
      id: `a11y-heading-${++issueId}`,
      wcagCriteria: "1.3.1",
      wcagLevel: "A",
      severity: "serious",
      title: "Missing page heading (H1)",
      description: "The page has no H1 heading.",
      impact: "Screen reader users cannot identify the main page topic.",
      howToFix: "Add a Hero component or H1 heading.",
      autoFixable: false,
    });
  } else if (h1s.length > 1) {
    issues.push({
      id: `a11y-heading-${++issueId}`,
      wcagCriteria: "1.3.1",
      wcagLevel: "A",
      severity: "moderate",
      title: "Multiple H1 headings",
      description: `Found ${h1s.length} H1 headings. Best practice is one per page.`,
      impact: "May confuse assistive technology about page structure.",
      howToFix: "Convert additional H1s to H2 or lower.",
      autoFixable: false,
    });
  }

  // Check for skipped levels
  if (headings.length > 1) {
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i - 1].level > 1) {
        issues.push({
          id: `a11y-heading-${++issueId}`,
          wcagCriteria: "1.3.1",
          wcagLevel: "A",
          severity: "moderate",
          title: `Heading level skipped (H${headings[i - 1].level} → H${headings[i].level})`,
          description: "Heading levels should be sequential without gaps.",
          impact: "Screen reader users may miss content structure.",
          howToFix: `Use H${headings[i - 1].level + 1} instead of H${headings[i].level}.`,
          autoFixable: false,
        });
      }
    }
  }

  // Check for empty headings
  for (const heading of headings) {
    if (!heading.text || heading.text.trim().length === 0) {
      issues.push({
        id: `a11y-heading-${++issueId}`,
        wcagCriteria: "2.4.6",
        wcagLevel: "AA",
        severity: "serious",
        title: "Empty heading detected",
        description: `An H${heading.level} heading has no text content.`,
        impact: "Empty headings confuse screen reader navigation.",
        howToFix: "Add meaningful text or remove the heading.",
        autoFixable: false,
      });
    }
  }

  return issues;
}

function checkLinkAccessibility(puckData: PuckData): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const links = extractLinks(puckData);
  let issueId = 0;

  const genericLinkTexts = [
    "click here", "here", "read more", "learn more", "more",
    "link", "this", "go", "see more"
  ];

  for (const link of links) {
    // Check for missing link text
    if (!link.text && !link.hasAriaLabel) {
      issues.push({
        id: `a11y-link-${++issueId}`,
        wcagCriteria: "2.4.4",
        wcagLevel: "A",
        severity: "serious",
        title: "Link has no accessible text",
        description: `A link in ${link.componentType} has no visible or accessible text.`,
        impact: "Screen reader users cannot understand the link purpose.",
        howToFix: "Add visible link text or an aria-label.",
        componentType: link.componentType,
        componentId: link.componentId,
        autoFixable: true,
        affectedElement: link.href,
      });
    }
    // Check for generic link text
    else if (link.text && genericLinkTexts.includes(link.text.toLowerCase().trim())) {
      issues.push({
        id: `a11y-link-${++issueId}`,
        wcagCriteria: "2.4.4",
        wcagLevel: "A",
        severity: "moderate",
        title: "Non-descriptive link text",
        description: `Link text "${link.text}" doesn't describe the destination.`,
        impact: "Users cannot determine link purpose without surrounding context.",
        howToFix: "Use descriptive text like 'Read about our services' instead.",
        componentType: link.componentType,
        autoFixable: true,
        affectedElement: link.text,
      });
    }
  }

  return issues;
}

function checkFormAccessibility(puckData: PuckData): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const fields = extractFormFields(puckData);
  let issueId = 0;

  for (const field of fields) {
    if (!field.hasLabel && !field.hasAriaLabel) {
      issues.push({
        id: `a11y-form-${++issueId}`,
        wcagCriteria: "4.1.2",
        wcagLevel: "A",
        severity: "critical",
        title: "Form field missing label",
        description: `A form field${field.fieldName ? ` (${field.fieldName})` : ""} in ${field.componentType} has no label.`,
        impact: "Screen reader users won't know what information to enter.",
        howToFix: "Add a visible label or aria-label to the field.",
        componentType: field.componentType,
        autoFixable: true,
        affectedElement: field.fieldName,
      });
    }
  }

  return issues;
}

function checkColorUsage(puckData: PuckData): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let issueId = 0;

  if (!puckData.content) return issues;

  // Look for potential color-only indicators
  for (const component of puckData.content) {
    const props = component.props || {};
    
    // Check for status indicators that might rely on color
    if (props.status || props.state || props.variant) {
      const value = (props.status || props.state || props.variant) as string;
      if (["success", "error", "warning", "danger", "info"].includes(value?.toLowerCase())) {
        issues.push({
          id: `a11y-color-${++issueId}`,
          wcagCriteria: "1.4.1",
          wcagLevel: "A",
          severity: "moderate",
          title: "Potential color-only information",
          description: `${component.type} uses status "${value}" which may rely on color alone.`,
          impact: "Color-blind users may miss status information.",
          howToFix: "Ensure status is also conveyed through text or icons.",
          componentType: component.type,
          autoFixable: false,
        });
      }
    }
  }

  return issues;
}

// ============================================
// Main Accessibility Check Function
// ============================================

export function checkAccessibility(puckData: PuckData): AccessibilityResult {
  // Run all checks
  const imageIssues = checkImageAlternatives(puckData);
  const headingIssues = checkHeadingStructure(puckData);
  const linkIssues = checkLinkAccessibility(puckData);
  const formIssues = checkFormAccessibility(puckData);
  const colorIssues = checkColorUsage(puckData);

  const allIssues = [
    ...imageIssues,
    ...headingIssues,
    ...linkIssues,
    ...formIssues,
    ...colorIssues,
  ];

  // Count by severity
  const summary = {
    critical: allIssues.filter(i => i.severity === "critical").length,
    serious: allIssues.filter(i => i.severity === "serious").length,
    moderate: allIssues.filter(i => i.severity === "moderate").length,
    minor: allIssues.filter(i => i.severity === "minor").length,
  };

  // Calculate score
  const score = Math.max(0, Math.round(
    100 - (summary.critical * 20) - (summary.serious * 10) - (summary.moderate * 5) - (summary.minor * 2)
  ));

  // Track passed checks
  const passedChecks: string[] = [];
  if (imageIssues.length === 0) passedChecks.push("All images have alt text");
  if (headingIssues.length === 0) passedChecks.push("Heading structure is correct");
  if (linkIssues.length === 0) passedChecks.push("All links are accessible");
  if (formIssues.length === 0) passedChecks.push("Form fields have labels");
  if (colorIssues.length === 0) passedChecks.push("Color usage appears accessible");

  // Determine WCAG compliance
  const levelACriteria = allIssues.filter(i => i.wcagLevel === "A");
  const levelAACriteria = allIssues.filter(i => i.wcagLevel === "AA");
  const levelAAACriteria = allIssues.filter(i => i.wcagLevel === "AAA");

  return {
    score,
    issues: allIssues,
    summary,
    passedChecks,
    wcagCompliance: {
      A: levelACriteria.length === 0,
      AA: levelACriteria.length === 0 && levelAACriteria.length === 0,
      AAA: allIssues.length === 0,
    },
  };
}

// ============================================
// Auto-Fix Helpers
// ============================================

export interface AccessibilityFix {
  issueId: string;
  componentId?: string;
  field: string;
  originalValue?: string;
  suggestedValue: string;
}

export async function generateAltText(
  imageSrc: string,
  context?: string
): Promise<string> {
  // In a real implementation, this could use AI vision
  // For now, generate based on filename
  try {
    const filename = imageSrc.split("/").pop() || "";
    const cleanName = filename
      .replace(/\.[^.]+$/, "") // Remove extension
      .replace(/[-_]/g, " ")   // Replace dashes/underscores
      .replace(/\d+/g, "")     // Remove numbers
      .trim();
    
    if (cleanName.length > 2) {
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    
    return context ? `Image related to ${context}` : "Decorative image";
  } catch {
    return "Image";
  }
}

export function suggestLinkText(
  currentText: string,
  href?: string,
  context?: string
): string {
  // Improve generic link texts
  const genericTexts: Record<string, string> = {
    "click here": context ? `Visit ${context}` : "Learn more about our services",
    "here": context ? `See ${context}` : "View details",
    "read more": context ? `Read more about ${context}` : "Read the full article",
    "learn more": context ? `Learn more about ${context}` : "Discover how it works",
    "more": context ? `More about ${context}` : "See more details",
  };

  const lower = currentText.toLowerCase().trim();
  return genericTexts[lower] || currentText;
}
