/**
 * SEO Analyzer - Analyze pages for SEO best practices
 */

export interface SeoIssue {
  type: "error" | "warning" | "info";
  field: string;
  message: string;
  suggestion: string;
}

export interface SeoAuditResult {
  score: number;
  issues: SeoIssue[];
  passed: string[];
}

export interface SeoAnalysisInput {
  title: string;
  description?: string | null;
  content?: string | null;
  slug: string;
  ogImage?: string | null;
  keywords?: string[];
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
}

/**
 * Analyze a page for SEO best practices
 */
export function analyzeSeo(page: SeoAnalysisInput): SeoAuditResult {
  const issues: SeoIssue[] = [];
  const passed: string[] = [];

  // Title checks
  analyzeTitle(page.title, issues, passed);

  // Description checks
  analyzeDescription(page.description, issues, passed);

  // OG Image check
  analyzeOgImage(page.ogImage, issues, passed);

  // Content checks
  if (page.content) {
    analyzeContent(page.content, issues, passed);
  }

  // Keywords check
  analyzeKeywords(page.keywords, issues, passed);

  // Slug check
  analyzeSlug(page.slug, issues, passed);

  // OG Title check
  analyzeOgTitle(page.ogTitle, page.title, issues, passed);

  // OG Description check
  analyzeOgDescription(page.ogDescription, page.description, issues, passed);

  // Canonical URL check
  analyzeCanonicalUrl(page.canonicalUrl, issues, passed);

  // Calculate score
  const score = calculateScore(issues);

  return {
    score,
    issues,
    passed,
  };
}

/**
 * Analyze page title
 */
function analyzeTitle(title: string | undefined | null, issues: SeoIssue[], passed: string[]): void {
  if (!title) {
    issues.push({
      type: "error",
      field: "title",
      message: "Missing page title",
      suggestion: "Add a descriptive page title (50-60 characters)",
    });
    return;
  }

  const length = title.length;

  if (length < 30) {
    issues.push({
      type: "warning",
      field: "title",
      message: `Title is too short (${length} characters)`,
      suggestion: "Expand title to 50-60 characters for better SEO",
    });
  } else if (length > 60) {
    issues.push({
      type: "warning",
      field: "title",
      message: `Title may be truncated in search results (${length} characters)`,
      suggestion: "Shorten title to under 60 characters",
    });
  } else {
    passed.push("Title length is optimal");
  }

  // Check for special characters that might cause issues
  if (title.includes("|") || title.includes("-")) {
    passed.push("Title uses separator for branding");
  }

  // Check for title uniqueness indicators
  if (title.toLowerCase().includes("untitled") || title.toLowerCase().includes("page")) {
    issues.push({
      type: "warning",
      field: "title",
      message: "Title appears generic",
      suggestion: "Use a unique, descriptive title for this page",
    });
  }
}

/**
 * Analyze meta description
 */
function analyzeDescription(
  description: string | undefined | null,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (!description) {
    issues.push({
      type: "error",
      field: "description",
      message: "Missing meta description",
      suggestion: "Add a compelling description (150-160 characters)",
    });
    return;
  }

  const length = description.length;

  if (length < 100) {
    issues.push({
      type: "warning",
      field: "description",
      message: `Description is too short (${length} characters)`,
      suggestion: "Expand description to 150-160 characters",
    });
  } else if (length > 160) {
    issues.push({
      type: "warning",
      field: "description",
      message: `Description may be truncated (${length} characters)`,
      suggestion: "Shorten description to under 160 characters",
    });
  } else {
    passed.push("Meta description length is optimal");
  }

  // Check for call to action
  const ctaWords = ["learn", "discover", "find", "get", "try", "start", "click", "explore"];
  const hasCtA = ctaWords.some((word) => description.toLowerCase().includes(word));
  if (hasCtA) {
    passed.push("Description includes call-to-action");
  }
}

/**
 * Analyze Open Graph image
 */
function analyzeOgImage(
  ogImage: string | undefined | null,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (!ogImage) {
    issues.push({
      type: "warning",
      field: "ogImage",
      message: "Missing Open Graph image",
      suggestion: "Add an image for social sharing (1200x630px recommended)",
    });
  } else {
    passed.push("Open Graph image is set");

    // Check for common image formats
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      ogImage.toLowerCase().includes(ext)
    );
    if (!hasValidExtension) {
      issues.push({
        type: "info",
        field: "ogImage",
        message: "OG image format may not be optimal",
        suggestion: "Use JPG, PNG, or WebP format for best compatibility",
      });
    }
  }
}

/**
 * Analyze page content
 */
function analyzeContent(content: string, issues: SeoIssue[], passed: string[]): void {
  // Strip HTML tags and count words
  const textContent = content.replace(/<[^>]+>/g, " ");
  const words = textContent.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 300) {
    issues.push({
      type: "warning",
      field: "content",
      message: `Page has thin content (${wordCount} words)`,
      suggestion: "Add more content (aim for 500+ words for main pages)",
    });
  } else if (wordCount >= 500) {
    passed.push(`Content has ${wordCount} words (good length)`);
  } else {
    passed.push(`Content has ${wordCount} words`);
  }

  // Check for H1 heading
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 0) {
    issues.push({
      type: "warning",
      field: "headings",
      message: "Missing H1 heading",
      suggestion: "Add a main H1 heading to your page",
    });
  } else if (h1Count > 1) {
    issues.push({
      type: "warning",
      field: "headings",
      message: `Multiple H1 headings found (${h1Count})`,
      suggestion: "Use only one H1 heading per page",
    });
  } else {
    passed.push("H1 heading present");
  }

  // Check for H2 headings
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count === 0 && wordCount > 300) {
    issues.push({
      type: "info",
      field: "headings",
      message: "No H2 subheadings found",
      suggestion: "Add H2 subheadings to structure your content",
    });
  } else if (h2Count > 0) {
    passed.push(`${h2Count} H2 subheading(s) found`);
  }

  // Check for images
  const images = content.match(/<img[^>]*>/gi) || [];
  if (images.length > 0) {
    // Check for images without alt text
    const imagesWithoutAlt = images.filter(
      (img) => !img.includes("alt=") || img.includes('alt=""') || img.includes("alt=''")
    );
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: "warning",
        field: "images",
        message: `${imagesWithoutAlt.length} image(s) missing alt text`,
        suggestion: "Add descriptive alt text to all images for accessibility and SEO",
      });
    } else {
      passed.push("All images have alt text");
    }
  }

  // Check for internal links
  const links = content.match(/<a[^>]*href[^>]*>/gi) || [];
  const internalLinks = links.filter(
    (link) => !link.includes("http://") && !link.includes("https://")
  );
  if (internalLinks.length > 0) {
    passed.push(`${internalLinks.length} internal link(s) found`);
  }

  // Check for external links
  const externalLinks = links.filter(
    (link) => link.includes("http://") || link.includes("https://")
  );
  if (externalLinks.length > 0) {
    // Check for nofollow on external links
    const linksWithNofollow = externalLinks.filter((link) =>
      link.includes("nofollow")
    );
    if (linksWithNofollow.length < externalLinks.length) {
      issues.push({
        type: "info",
        field: "links",
        message: "Some external links may not have nofollow",
        suggestion: "Consider adding rel='nofollow' to untrusted external links",
      });
    }
  }
}

/**
 * Analyze keywords
 */
function analyzeKeywords(
  keywords: string[] | undefined | null,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (!keywords || keywords.length === 0) {
    issues.push({
      type: "info",
      field: "keywords",
      message: "No focus keywords set",
      suggestion: "Add 3-5 relevant keywords for this page",
    });
  } else if (keywords.length > 10) {
    issues.push({
      type: "warning",
      field: "keywords",
      message: `Too many keywords (${keywords.length})`,
      suggestion: "Focus on 3-5 main keywords for best results",
    });
  } else {
    passed.push(`${keywords.length} keyword(s) set`);
  }
}

/**
 * Analyze URL slug
 */
function analyzeSlug(slug: string, issues: SeoIssue[], passed: string[]): void {
  if (slug.includes("_")) {
    issues.push({
      type: "warning",
      field: "slug",
      message: "URL slug contains underscores",
      suggestion: "Use hyphens instead of underscores in URLs",
    });
  } else if (slug.includes(" ")) {
    issues.push({
      type: "error",
      field: "slug",
      message: "URL slug contains spaces",
      suggestion: "Remove spaces from URL and use hyphens instead",
    });
  } else if (slug.length > 60) {
    issues.push({
      type: "warning",
      field: "slug",
      message: `URL slug is very long (${slug.length} characters)`,
      suggestion: "Keep URLs short and descriptive (under 60 characters)",
    });
  } else {
    passed.push("URL slug is SEO-friendly");
  }

  // Check for uppercase letters
  if (slug !== slug.toLowerCase()) {
    issues.push({
      type: "warning",
      field: "slug",
      message: "URL contains uppercase letters",
      suggestion: "Use lowercase letters in URLs for consistency",
    });
  }

  // Check for special characters
  const specialChars = /[^a-z0-9-]/i;
  if (specialChars.test(slug) && !slug.includes("/")) {
    issues.push({
      type: "warning",
      field: "slug",
      message: "URL contains special characters",
      suggestion: "Use only letters, numbers, and hyphens in URLs",
    });
  }
}

/**
 * Analyze OG Title
 */
function analyzeOgTitle(
  ogTitle: string | undefined | null,
  pageTitle: string,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (!ogTitle) {
    // OG title will fall back to page title, so just info
    issues.push({
      type: "info",
      field: "ogTitle",
      message: "No custom OG title set",
      suggestion: "Consider adding a custom title for social sharing",
    });
  } else if (ogTitle.length > 70) {
    issues.push({
      type: "warning",
      field: "ogTitle",
      message: `OG title may be truncated (${ogTitle.length} characters)`,
      suggestion: "Keep OG title under 70 characters",
    });
  } else {
    passed.push("Custom OG title set");
  }
}

/**
 * Analyze OG Description
 */
function analyzeOgDescription(
  ogDescription: string | undefined | null,
  pageDescription: string | undefined | null,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (!ogDescription && !pageDescription) {
    issues.push({
      type: "warning",
      field: "ogDescription",
      message: "No OG description available",
      suggestion: "Add a description for social sharing",
    });
  } else if (ogDescription) {
    if (ogDescription.length > 200) {
      issues.push({
        type: "warning",
        field: "ogDescription",
        message: `OG description may be truncated (${ogDescription.length} characters)`,
        suggestion: "Keep OG description under 200 characters",
      });
    } else {
      passed.push("Custom OG description set");
    }
  }
}

/**
 * Analyze Canonical URL
 */
function analyzeCanonicalUrl(
  canonicalUrl: string | undefined | null,
  issues: SeoIssue[],
  passed: string[]
): void {
  if (canonicalUrl) {
    // Validate URL format
    try {
      new URL(canonicalUrl);
      passed.push("Canonical URL is set");
    } catch {
      issues.push({
        type: "error",
        field: "canonicalUrl",
        message: "Invalid canonical URL format",
        suggestion: "Ensure canonical URL is a valid absolute URL",
      });
    }
  }
}

/**
 * Calculate overall SEO score
 */
function calculateScore(issues: SeoIssue[]): number {
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;
  const infoCount = issues.filter((i) => i.type === "info").length;

  let score = 100;
  score -= errorCount * 20; // Errors have the biggest impact
  score -= warningCount * 10; // Warnings are moderate
  score -= infoCount * 3; // Info items are minor

  return Math.max(0, Math.min(100, score));
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get score background color class
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 50) return "bg-yellow-100";
  return "bg-red-100";
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

/**
 * Get issue type icon color
 */
export function getIssueColor(type: SeoIssue["type"]): string {
  switch (type) {
    case "error":
      return "text-red-600";
    case "warning":
      return "text-yellow-600";
    case "info":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}
