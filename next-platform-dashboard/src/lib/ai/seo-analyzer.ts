/**
 * SEO Analyzer Service
 * 
 * Advanced SEO analysis for page content.
 * Part of PHASE-ED-05C: AI Editor - Content Optimization
 */

import { anthropic, AI_MODELS } from "./config";
import type { Data as PuckData } from "@puckeditor/core";

// ============================================
// Types
// ============================================

export interface SEOIssue {
  id: string;
  category: "meta" | "content" | "structure" | "keywords" | "links" | "images";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  fix: string;
  autoFixable: boolean;
  currentValue?: string;
  suggestedValue?: string;
}

export interface SEOAnalysisResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  issues: SEOIssue[];
  summary: {
    meta: { score: number; issues: number };
    content: { score: number; issues: number };
    structure: { score: number; issues: number };
    keywords: { score: number; issues: number };
  };
}

export interface SEOContext {
  puckData: PuckData;
  pageTitle?: string;
  pageDescription?: string;
  pageUrl?: string;
  targetKeywords?: string[];
  locale?: string;
}

// ============================================
// Constants
// ============================================

const SEO_THRESHOLDS = {
  title: { min: 30, optimal: 60, max: 70 },
  description: { min: 120, optimal: 155, max: 160 },
  h1Count: { min: 1, max: 1 },
  keywordDensity: { min: 0.5, optimal: 1.5, max: 3.0 },
  contentLength: { min: 300, optimal: 1500 },
};

// ============================================
// Content Extraction
// ============================================

function extractAllText(puckData: PuckData): string {
  let text = "";
  
  if (!puckData.content) return text;

  for (const component of puckData.content) {
    if (component.props) {
      for (const [key, value] of Object.entries(component.props)) {
        if (typeof value === "string") {
          text += ` ${value}`;
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string") {
              text += ` ${item}`;
            } else if (typeof item === "object" && item !== null) {
              for (const v of Object.values(item)) {
                if (typeof v === "string") {
                  text += ` ${v}`;
                }
              }
            }
          }
        }
      }
    }
  }

  return text.trim();
}

function countHeadings(puckData: PuckData): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  
  if (!puckData.content) return counts;

  for (const component of puckData.content) {
    // Count Hero as H1
    if (component.type === "Hero") {
      counts[1]++;
    }
    // Count Heading components
    if (component.type === "Heading" && component.props?.level) {
      const level = component.props.level as number;
      if (level >= 1 && level <= 6) {
        counts[level]++;
      }
    }
  }

  return counts;
}

function extractLinks(puckData: PuckData): Array<{ href: string; text: string; type: "internal" | "external" }> {
  const links: Array<{ href: string; text: string; type: "internal" | "external" }> = [];
  
  if (!puckData.content) return links;

  for (const component of puckData.content) {
    if (component.props) {
      // Check common link fields
      const linkFields = ["href", "url", "link", "ctaLink", "buttonLink"];
      for (const field of linkFields) {
        const href = component.props[field];
        if (typeof href === "string" && href.length > 0) {
          const isExternal = href.startsWith("http") && !href.includes(typeof window !== "undefined" ? window.location.hostname : "");
          links.push({
            href,
            text: (component.props.ctaText || component.props.buttonText || component.props.text || "") as string,
            type: isExternal ? "external" : "internal",
          });
        }
      }
    }
  }

  return links;
}

function extractImages(puckData: PuckData): Array<{ src: string; alt?: string; hasAlt: boolean }> {
  const images: Array<{ src: string; alt?: string; hasAlt: boolean }> = [];
  
  if (!puckData.content) return images;

  for (const component of puckData.content) {
    if (component.props) {
      const imageSrc = component.props.src || component.props.image || component.props.backgroundImage;
      if (typeof imageSrc === "string" && imageSrc.length > 0) {
        const alt = component.props.alt as string | undefined;
        images.push({
          src: imageSrc,
          alt,
          hasAlt: !!alt && alt.trim().length > 0,
        });
      }
    }
  }

  return images;
}

// ============================================
// Analysis Functions
// ============================================

function analyzeMetaTags(context: SEOContext): SEOIssue[] {
  const issues: SEOIssue[] = [];
  let issueId = 0;

  // Title analysis
  if (!context.pageTitle || context.pageTitle.trim().length === 0) {
    issues.push({
      id: `meta-${++issueId}`,
      category: "meta",
      severity: "critical",
      title: "Missing page title",
      description: "The page is missing a title tag.",
      impact: "Page title is crucial for SEO and click-through rates.",
      fix: "Add a descriptive, keyword-rich title.",
      autoFixable: true,
    });
  } else {
    const titleLen = context.pageTitle.length;
    if (titleLen < SEO_THRESHOLDS.title.min) {
      issues.push({
        id: `meta-${++issueId}`,
        category: "meta",
        severity: "warning",
        title: "Page title too short",
        description: `Title is ${titleLen} characters. Should be ${SEO_THRESHOLDS.title.min}-${SEO_THRESHOLDS.title.max} characters.`,
        impact: "Short titles may not rank well for multiple keywords.",
        fix: "Expand the title with relevant keywords.",
        autoFixable: true,
        currentValue: context.pageTitle,
      });
    } else if (titleLen > SEO_THRESHOLDS.title.max) {
      issues.push({
        id: `meta-${++issueId}`,
        category: "meta",
        severity: "warning",
        title: "Page title too long",
        description: `Title is ${titleLen} characters. May be truncated in search results.`,
        impact: "Truncated titles can reduce click-through rates.",
        fix: "Shorten the title while keeping important keywords at the start.",
        autoFixable: true,
        currentValue: context.pageTitle,
      });
    }
  }

  // Description analysis
  if (!context.pageDescription || context.pageDescription.trim().length === 0) {
    issues.push({
      id: `meta-${++issueId}`,
      category: "meta",
      severity: "critical",
      title: "Missing meta description",
      description: "The page has no meta description.",
      impact: "Search engines may auto-generate a poor description.",
      fix: "Add a compelling meta description with target keywords.",
      autoFixable: true,
    });
  } else {
    const descLen = context.pageDescription.length;
    if (descLen < SEO_THRESHOLDS.description.min) {
      issues.push({
        id: `meta-${++issueId}`,
        category: "meta",
        severity: "warning",
        title: "Meta description too short",
        description: `Description is ${descLen} characters. Aim for ${SEO_THRESHOLDS.description.min}-${SEO_THRESHOLDS.description.max}.`,
        impact: "Short descriptions don't utilize full SERP space.",
        fix: "Expand description with benefits and a call-to-action.",
        autoFixable: true,
        currentValue: context.pageDescription,
      });
    } else if (descLen > SEO_THRESHOLDS.description.max) {
      issues.push({
        id: `meta-${++issueId}`,
        category: "meta",
        severity: "info",
        title: "Meta description may be truncated",
        description: `Description is ${descLen} characters.`,
        impact: "Truncation can cut off important information.",
        fix: "Front-load key information within first 155 characters.",
        autoFixable: true,
        currentValue: context.pageDescription,
      });
    }
  }

  return issues;
}

function analyzeHeadingStructure(puckData: PuckData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  let issueId = 0;
  const headingCounts = countHeadings(puckData);

  // H1 check
  if (headingCounts[1] === 0) {
    issues.push({
      id: `structure-${++issueId}`,
      category: "structure",
      severity: "critical",
      title: "Missing H1 heading",
      description: "The page has no H1 heading.",
      impact: "H1 is critical for SEO and accessibility.",
      fix: "Add a Hero component or H1 heading at the top of the page.",
      autoFixable: false,
    });
  } else if (headingCounts[1] > 1) {
    issues.push({
      id: `structure-${++issueId}`,
      category: "structure",
      severity: "warning",
      title: "Multiple H1 headings",
      description: `Found ${headingCounts[1]} H1 headings. Best practice is one H1 per page.`,
      impact: "Multiple H1s can confuse search engines about page focus.",
      fix: "Change additional H1s to H2 or lower.",
      autoFixable: false,
    });
  }

  // Check for skipped heading levels
  let prevLevel = 0;
  for (let level = 1; level <= 6; level++) {
    if (headingCounts[level] > 0) {
      if (prevLevel > 0 && level - prevLevel > 1) {
        issues.push({
          id: `structure-${++issueId}`,
          category: "structure",
          severity: "warning",
          title: `Skipped heading level H${prevLevel} → H${level}`,
          description: "Heading levels should not skip (e.g., H1 to H3).",
          impact: "Improper hierarchy affects accessibility and SEO.",
          fix: `Add H${prevLevel + 1} headings or change H${level} to H${prevLevel + 1}.`,
          autoFixable: false,
        });
      }
      prevLevel = level;
    }
  }

  return issues;
}

function analyzeKeywordUsage(context: SEOContext): SEOIssue[] {
  const issues: SEOIssue[] = [];
  
  if (!context.targetKeywords || context.targetKeywords.length === 0) {
    issues.push({
      id: "keywords-1",
      category: "keywords",
      severity: "info",
      title: "No target keywords specified",
      description: "Keyword analysis requires target keywords to be set.",
      impact: "Cannot verify keyword optimization without targets.",
      fix: "Set target keywords for this page.",
      autoFixable: false,
    });
    return issues;
  }

  const allText = extractAllText(context.puckData).toLowerCase();
  const wordCount = allText.split(/\s+/).length;
  let issueId = 1;

  for (const keyword of context.targetKeywords) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = allText.match(regex);
    const count = matches ? matches.length : 0;
    const density = (count / wordCount) * 100;

    if (count === 0) {
      issues.push({
        id: `keywords-${++issueId}`,
        category: "keywords",
        severity: "warning",
        title: `Keyword "${keyword}" not found`,
        description: `Target keyword "${keyword}" does not appear in the content.`,
        impact: "Page may not rank for this keyword.",
        fix: "Naturally incorporate this keyword in headings and body text.",
        autoFixable: false,
      });
    } else if (density < SEO_THRESHOLDS.keywordDensity.min) {
      issues.push({
        id: `keywords-${++issueId}`,
        category: "keywords",
        severity: "info",
        title: `Low keyword density for "${keyword}"`,
        description: `Keyword appears ${count} times (${density.toFixed(1)}% density).`,
        impact: "May reduce relevance signals to search engines.",
        fix: "Add more natural mentions of this keyword.",
        autoFixable: false,
        currentValue: `${count} occurrences (${density.toFixed(1)}%)`,
      });
    } else if (density > SEO_THRESHOLDS.keywordDensity.max) {
      issues.push({
        id: `keywords-${++issueId}`,
        category: "keywords",
        severity: "warning",
        title: `Keyword stuffing detected for "${keyword}"`,
        description: `Keyword appears ${count} times (${density.toFixed(1)}% density).`,
        impact: "May trigger keyword stuffing penalties.",
        fix: "Reduce keyword usage and use synonyms instead.",
        autoFixable: false,
        currentValue: `${count} occurrences (${density.toFixed(1)}%)`,
      });
    }
  }

  // Check if keywords are in title
  if (context.pageTitle) {
    const titleLower = context.pageTitle.toLowerCase();
    const keywordsInTitle = context.targetKeywords.filter(k => 
      titleLower.includes(k.toLowerCase())
    );
    if (keywordsInTitle.length === 0) {
      issues.push({
        id: `keywords-${++issueId}`,
        category: "keywords",
        severity: "warning",
        title: "No target keywords in title",
        description: "None of the target keywords appear in the page title.",
        impact: "Title is a strong ranking factor.",
        fix: "Include primary keyword at the start of the title.",
        autoFixable: true,
        currentValue: context.pageTitle,
      });
    }
  }

  return issues;
}

function analyzeContent(puckData: PuckData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  let issueId = 0;

  const allText = extractAllText(puckData);
  const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < SEO_THRESHOLDS.contentLength.min) {
    issues.push({
      id: `content-${++issueId}`,
      category: "content",
      severity: "warning",
      title: "Thin content",
      description: `Page has only ${wordCount} words. Aim for at least ${SEO_THRESHOLDS.contentLength.min}.`,
      impact: "Thin content often ranks poorly and provides less value.",
      fix: "Add more valuable content, explanations, or sections.",
      autoFixable: false,
      currentValue: `${wordCount} words`,
    });
  }

  return issues;
}

function analyzeImages(puckData: PuckData): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const images = extractImages(puckData);
  let issueId = 0;

  const imagesWithoutAlt = images.filter(img => !img.hasAlt);
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      id: `images-${++issueId}`,
      category: "images",
      severity: imagesWithoutAlt.length > 2 ? "critical" : "warning",
      title: `${imagesWithoutAlt.length} image(s) missing alt text`,
      description: "Images without alt text hurt accessibility and SEO.",
      impact: "Missing alt text means lost keyword opportunities.",
      fix: "Add descriptive alt text to all images.",
      autoFixable: true,
      currentValue: imagesWithoutAlt.map(i => i.src).join(", "),
    });
  }

  return issues;
}

// ============================================
// Main Analysis Function
// ============================================

export async function analyzeSEO(context: SEOContext): Promise<SEOAnalysisResult> {
  // Run all analyses
  const metaIssues = analyzeMetaTags(context);
  const structureIssues = analyzeHeadingStructure(context.puckData);
  const keywordIssues = analyzeKeywordUsage(context);
  const contentIssues = analyzeContent(context.puckData);
  const imageIssues = analyzeImages(context.puckData);

  const allIssues = [
    ...metaIssues,
    ...structureIssues,
    ...keywordIssues,
    ...contentIssues,
    ...imageIssues,
  ];

  // Calculate scores
  const calculateCategoryScore = (issues: SEOIssue[]): number => {
    if (issues.length === 0) return 100;
    const criticalPenalty = issues.filter(i => i.severity === "critical").length * 25;
    const warningPenalty = issues.filter(i => i.severity === "warning").length * 10;
    const infoPenalty = issues.filter(i => i.severity === "info").length * 3;
    return Math.max(0, 100 - criticalPenalty - warningPenalty - infoPenalty);
  };

  const metaScore = calculateCategoryScore(metaIssues);
  const structureScore = calculateCategoryScore(structureIssues);
  const keywordScore = calculateCategoryScore(keywordIssues);
  const contentScore = calculateCategoryScore([...contentIssues, ...imageIssues]);

  // Overall score (weighted average)
  const overallScore = Math.round(
    (metaScore * 0.3) + (structureScore * 0.2) + (keywordScore * 0.25) + (contentScore * 0.25)
  );

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (overallScore >= 90) grade = "A";
  else if (overallScore >= 75) grade = "B";
  else if (overallScore >= 60) grade = "C";
  else if (overallScore >= 40) grade = "D";
  else grade = "F";

  return {
    score: overallScore,
    grade,
    issues: allIssues,
    summary: {
      meta: { score: metaScore, issues: metaIssues.length },
      content: { score: contentScore, issues: contentIssues.length + imageIssues.length },
      structure: { score: structureScore, issues: structureIssues.length },
      keywords: { score: keywordScore, issues: keywordIssues.length },
    },
  };
}

// ============================================
// AI-Powered Meta Tag Generation
// ============================================

export async function generateMetaTags(
  puckData: PuckData,
  options: {
    targetKeywords?: string[];
    businessName?: string;
    pageType?: "home" | "product" | "service" | "blog" | "about" | "contact";
  } = {}
): Promise<{ title: string; description: string }> {
  const allText = extractAllText(puckData);
  
  const prompt = `Generate SEO-optimized meta tags for this webpage.

CONTENT SUMMARY:
${allText.substring(0, 2000)}

BUSINESS: ${options.businessName || "Not specified"}
PAGE TYPE: ${options.pageType || "general"}
TARGET KEYWORDS: ${options.targetKeywords?.join(", ") || "Not specified"}

Generate:
1. A compelling page title (50-60 characters, keyword at start)
2. A meta description (150-155 characters, include CTA)

Return JSON only:
{
  "title": "Your Page Title Here | Brand",
  "description": "Your compelling meta description here with a clear call-to-action."
}`;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 500,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No response");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Meta tag generation error:", error);
    return {
      title: options.businessName ? `${options.businessName} - ${options.pageType || "Home"}` : "Page Title",
      description: "Discover more on our website.",
    };
  }
}
