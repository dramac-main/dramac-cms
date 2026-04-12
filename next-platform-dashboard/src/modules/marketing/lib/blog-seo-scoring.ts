/**
 * Marketing Module - Blog SEO Content Scoring
 *
 * Phase MKT-07: Analyzes blog post content and provides
 * marketing-focused SEO recommendations with a 0-100 score.
 */

import type {
  ContentScore,
  ContentRecommendation,
} from "../types/blog-marketing-types";

// ============================================================================
// SCORING ENGINE
// ============================================================================

interface ScoringInput {
  title: string;
  slug: string;
  contentHtml: string | null;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  tags: string[];
  categories: { id: string; name: string }[];
  targetKeyword?: string;
}

export function calculateContentScore(input: ScoringInput): ContentScore {
  const recommendations: ContentRecommendation[] = [];
  const html = input.contentHtml || "";
  const plainText = stripHtml(html);
  const wordCount = countWords(plainText);

  // ---- READABILITY ----
  let readability = 0;

  // Word count check
  if (wordCount >= 1000) {
    readability += 30;
  } else if (wordCount >= 500) {
    readability += 20;
    recommendations.push({
      category: "content",
      severity: "info",
      message: `Post has ${wordCount} words. Aim for 1,000+ words for better SEO ranking.`,
      currentValue: wordCount,
      suggestedValue: 1000,
    });
  } else {
    readability += 10;
    recommendations.push({
      category: "content",
      severity: "warning",
      message: `Post has only ${wordCount} words. Search engines favor longer, comprehensive content (1,000+).`,
      currentValue: wordCount,
      suggestedValue: 1000,
    });
  }

  // Sentence length / readability approximation
  const sentences = plainText
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.length > 0 ? wordCount / sentences.length : 0;

  if (avgSentenceLength > 0 && avgSentenceLength <= 20) {
    readability += 25;
  } else if (avgSentenceLength > 20 && avgSentenceLength <= 30) {
    readability += 15;
    recommendations.push({
      category: "readability",
      severity: "info",
      message:
        "Some sentences are long. Try breaking them up for easier reading.",
      currentValue: Math.round(avgSentenceLength),
      suggestedValue: 20,
    });
  } else if (avgSentenceLength > 30) {
    readability += 5;
    recommendations.push({
      category: "readability",
      severity: "warning",
      message:
        "Sentences are very long on average. Shorten them for better readability.",
      currentValue: Math.round(avgSentenceLength),
      suggestedValue: 20,
    });
  }

  // Paragraph count (well-structured)
  const paragraphs = html.match(/<p[\s>]/gi) || [];
  if (paragraphs.length >= 5) {
    readability += 20;
  } else if (paragraphs.length >= 3) {
    readability += 10;
    recommendations.push({
      category: "structure",
      severity: "info",
      message:
        "Add more paragraphs to break up content into digestible sections.",
    });
  } else {
    recommendations.push({
      category: "structure",
      severity: "warning",
      message:
        "Content has very few paragraphs. Break it into more sections for readability.",
    });
  }

  // Heading structure
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
  if (h2Count >= 2) {
    readability += 25;
  } else if (h2Count >= 1) {
    readability += 15;
    recommendations.push({
      category: "structure",
      severity: "info",
      message: "Add more H2 headings to structure your content (at least 2-3).",
      currentValue: h2Count,
      suggestedValue: 3,
    });
  } else {
    recommendations.push({
      category: "structure",
      severity: "error",
      message:
        "No H2 headings found. Add heading structure to improve readability and SEO.",
      currentValue: 0,
      suggestedValue: 3,
    });
  }

  readability = Math.min(100, readability);

  // ---- SEO SCORE ----
  let seoScore = 0;

  // Title length
  const titleLen = input.title.length;
  if (titleLen >= 30 && titleLen <= 60) {
    seoScore += 20;
  } else if (titleLen > 0 && titleLen < 30) {
    seoScore += 10;
    recommendations.push({
      category: "title",
      severity: "info",
      message: `Title is ${titleLen} characters. Optimal range is 50-60 characters for search results.`,
      currentValue: titleLen,
      suggestedValue: 55,
    });
  } else if (titleLen > 60) {
    seoScore += 12;
    recommendations.push({
      category: "title",
      severity: "warning",
      message: `Title is ${titleLen} characters. It may get truncated in search results (max ~60).`,
      currentValue: titleLen,
      suggestedValue: 60,
    });
  }

  // Meta description
  const metaLen = (input.metaDescription || "").length;
  if (metaLen >= 120 && metaLen <= 160) {
    seoScore += 20;
  } else if (metaLen > 0 && metaLen < 120) {
    seoScore += 12;
    recommendations.push({
      category: "meta",
      severity: "info",
      message: `Meta description is ${metaLen} characters. Aim for 120-160 for best display in search results.`,
      currentValue: metaLen,
      suggestedValue: 150,
    });
  } else if (metaLen > 160) {
    seoScore += 10;
    recommendations.push({
      category: "meta",
      severity: "warning",
      message: `Meta description is ${metaLen} characters. It may get truncated (max ~160).`,
      currentValue: metaLen,
      suggestedValue: 160,
    });
  } else {
    recommendations.push({
      category: "meta",
      severity: "error",
      message:
        "No meta description set. Add one for better search result previews.",
    });
  }

  // Meta title
  if (input.metaTitle && input.metaTitle.length > 0) {
    seoScore += 10;
  } else {
    recommendations.push({
      category: "meta",
      severity: "info",
      message: "No custom meta title set. The post title will be used instead.",
    });
  }

  // Featured image
  if (input.featuredImageUrl) {
    seoScore += 10;
    if (input.featuredImageAlt && input.featuredImageAlt.length > 0) {
      seoScore += 5;
    } else {
      recommendations.push({
        category: "media",
        severity: "warning",
        message:
          "Featured image has no alt text. Add alt text for accessibility and SEO.",
      });
    }
  } else {
    recommendations.push({
      category: "media",
      severity: "warning",
      message:
        "No featured image set. Posts with images get more engagement and social shares.",
    });
  }

  // Image alt texts in content
  const images = html.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = images.filter((img) => /alt=["'][^"']+["']/i.test(img));
  if (images.length > 0) {
    if (imagesWithAlt.length === images.length) {
      seoScore += 10;
    } else {
      seoScore += 5;
      recommendations.push({
        category: "media",
        severity: "warning",
        message: `${images.length - imagesWithAlt.length} of ${images.length} images are missing alt text.`,
      });
    }
  }

  // Internal links
  const links = html.match(/<a[^>]*href/gi) || [];
  if (links.length >= 2) {
    seoScore += 10;
  } else if (links.length === 1) {
    seoScore += 5;
    recommendations.push({
      category: "content",
      severity: "info",
      message:
        "Add more internal links to other posts or pages (recommended: 2-3).",
    });
  } else {
    recommendations.push({
      category: "content",
      severity: "info",
      message:
        "No links found in content. Add internal links to improve navigation and SEO.",
    });
  }

  // Keyword usage (if target keyword provided)
  if (input.targetKeyword) {
    const kw = input.targetKeyword.toLowerCase();
    const kwInTitle = input.title.toLowerCase().includes(kw);
    const kwInMeta = (input.metaDescription || "").toLowerCase().includes(kw);
    const kwCount = countOccurrences(plainText.toLowerCase(), kw);
    const kwDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;

    if (kwInTitle) seoScore += 5;
    else {
      recommendations.push({
        category: "content",
        severity: "warning",
        message: `Target keyword "${input.targetKeyword}" not found in post title.`,
      });
    }

    if (kwInMeta) seoScore += 5;
    else if (input.metaDescription) {
      recommendations.push({
        category: "meta",
        severity: "info",
        message: `Target keyword "${input.targetKeyword}" not found in meta description.`,
      });
    }

    if (kwDensity >= 0.5 && kwDensity <= 2.5) {
      seoScore += 5;
    } else if (kwDensity > 2.5) {
      recommendations.push({
        category: "content",
        severity: "warning",
        message: `Keyword density is ${kwDensity.toFixed(1)}%. This may be seen as keyword stuffing (aim for 0.5-2.5%).`,
      });
    } else if (kwCount > 0) {
      recommendations.push({
        category: "content",
        severity: "info",
        message: `Keyword density is ${kwDensity.toFixed(1)}%. Consider mentioning it a few more times naturally.`,
      });
    }
  }

  seoScore = Math.min(100, seoScore);

  // ---- ENGAGEMENT POTENTIAL ----
  let engagementPotential = 0;

  // Has CTA in content
  const hasCta =
    /<a[^>]*class[^>]*btn/i.test(html) ||
    /call.to.action|subscribe|sign.up|get.started|learn.more|download/i.test(
      plainText,
    );
  if (hasCta) {
    engagementPotential += 20;
  } else {
    recommendations.push({
      category: "cta",
      severity: "warning",
      message:
        "No call-to-action found in post. Add a CTA to drive reader engagement.",
    });
  }

  // Word count for engagement
  if (wordCount >= 1500) engagementPotential += 25;
  else if (wordCount >= 800) engagementPotential += 15;
  else engagementPotential += 5;

  // Has categories
  if (input.categories.length > 0) engagementPotential += 10;

  // Has tags
  if (input.tags.length >= 3) engagementPotential += 10;
  else if (input.tags.length > 0) engagementPotential += 5;
  else {
    recommendations.push({
      category: "content",
      severity: "info",
      message:
        "Add tags to improve discoverability and related post suggestions.",
    });
  }

  // Has excerpt
  if (input.excerpt && input.excerpt.length > 0) {
    engagementPotential += 10;
  } else {
    recommendations.push({
      category: "content",
      severity: "info",
      message:
        "Add an excerpt for better social sharing previews and blog listings.",
    });
  }

  // Heading structure aids scannability
  if (h2Count >= 2 && h3Count >= 1) engagementPotential += 15;
  else if (h2Count >= 1) engagementPotential += 8;

  // Has images (visual engagement)
  if (images.length >= 2) engagementPotential += 10;
  else if (images.length === 1) engagementPotential += 5;

  engagementPotential = Math.min(100, engagementPotential);

  // ---- OVERALL ----
  const overall = Math.round(
    readability * 0.3 + seoScore * 0.4 + engagementPotential * 0.3,
  );

  return {
    overall: Math.min(100, overall),
    readability: Math.min(100, readability),
    seoScore: Math.min(100, seoScore),
    engagementPotential: Math.min(100, engagementPotential),
    recommendations: recommendations.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function countOccurrences(text: string, search: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}
