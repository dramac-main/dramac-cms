/**
 * Landing Page HTML Renderer
 *
 * Shared rendering engine used by both:
 * - /api/marketing/lp/[siteId]/[slug] (public live page)
 * - /api/marketing/lp/preview (in-editor preview)
 *
 * Guarantees the preview matches the live output exactly.
 */

import type {
  LandingPage,
  LandingPageBlock,
  SeoConfig,
  StyleConfig,
} from "../types/landing-page-types";
import { DEFAULT_STYLE_CONFIG } from "../types/landing-page-types";

// ============================================================================
// MAIN RENDERER
// ============================================================================

export function renderLandingPageHtml(opts: {
  page?: Partial<LandingPage>;
  blocks: LandingPageBlock[];
  seo?: SeoConfig;
  styleConfig?: StyleConfig | null;
  origin?: string;
  pageId?: string;
  isPreview?: boolean;
}): string {
  const {
    page,
    blocks,
    seo = {},
    styleConfig,
    origin = "",
    pageId = "",
    isPreview = false,
  } = opts;

  const style = { ...DEFAULT_STYLE_CONFIG, ...(styleConfig || {}) };
  const title = seo.metaTitle || page?.title || "Landing Page";
  const description = seo.metaDescription || page?.description || "";
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  const ogImage = seo.ogImage || "";
  const canonicalUrl = seo.canonicalUrl || "";

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const blocksHtml = sortedBlocks.map((b) => renderBlock(b)).join("\n");
  const fontImports = getGoogleFontImports(style);

  // Build JSON-LD structured data
  const jsonLd = buildJsonLd(title, description, ogImage, canonicalUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  ${seo.noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />'}
  ${canonicalUrl ? `<link rel="canonical" href="${esc(canonicalUrl)}" />` : ""}
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(ogDescription)}" />
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : ""}
  ${canonicalUrl ? `<meta property="og:url" content="${esc(canonicalUrl)}" />` : ""}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(ogDescription)}" />
  ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : ""}

  ${fontImports}
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <style>${getBaseStyles(style)}</style>
</head>
<body>
  <main class="lp-main">
    ${blocksHtml}
  </main>
  ${!isPreview ? `<script>${getClientScript(origin, pageId)}</script>` : `<script>${getPreviewScript()}</script>`}
</body>
</html>`;
}

// ============================================================================
// 404 PAGE
// ============================================================================

export function render404Page(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page Not Found</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; color: #333; }
    .wrap { text-align: center; padding: 2rem; }
    h1 { font-size: 4rem; font-weight: 800; color: #e5e7eb; margin: 0 0 1rem; }
    p { font-size: 1.125rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>404</h1>
    <p>This landing page doesn&rsquo;t exist or hasn&rsquo;t been published yet.</p>
  </div>
</body>
</html>`;
}

// ============================================================================
// JSON-LD STRUCTURED DATA
// ============================================================================

function buildJsonLd(
  title: string,
  description: string,
  image: string,
  url: string,
) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
  };
  if (url) ld.url = url;
  if (image) ld.image = image;
  return ld;
}

// ============================================================================
// GOOGLE FONT IMPORTS
// ============================================================================

function getGoogleFontImports(style: StyleConfig): string {
  const families = new Set<string>();

  for (const font of [style.headingFont, style.bodyFont]) {
    if (!font) continue;
    // Extract family name from CSS font stack, e.g. "'Inter', sans-serif" -> "Inter"
    const match = font.match(/^'([^']+)'/);
    if (match) {
      const family = match[1];
      // Skip system / generic fonts
      if (
        ![
          "system-ui",
          "Georgia",
          "-apple-system",
          "sans-serif",
          "serif",
          "monospace",
        ].includes(family)
      ) {
        families.add(family);
      }
    }
  }

  if (families.size === 0) return "";

  const params = Array.from(families)
    .map((f) => `family=${f.replace(/\s+/g, "+")}:wght@400;500;600;700;800`)
    .join("&");

  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${params}&display=swap" />`;
}

// ============================================================================
// BLOCK RENDERERS
// ============================================================================

function renderBlock(block: LandingPageBlock): string {
  const c = block.content;
  switch (block.type) {
    case "hero":
      return renderHero(c);
    case "features":
      return renderFeatures(c);
    case "testimonials":
      return renderTestimonials(c);
    case "cta":
      return renderCTA(c);
    case "optin_form":
      return renderOptinForm(c);
    case "video":
      return renderVideo(c);
    case "gallery":
      return renderGallery(c);
    case "countdown":
      return renderCountdown(c);
    case "faq":
      return renderFAQ(c);
    case "pricing":
      return renderPricing(c);
    case "social_proof":
      return renderSocialProof(c);
    case "text":
      return renderText(c);
    case "image":
      return renderImage(c);
    default:
      return "";
  }
}

function renderHero(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Your Headline Here"));
  const subheading = esc(String(c.subheading || ""));
  const buttonText = esc(String(c.buttonText || ""));
  const buttonUrl = esc(String(c.buttonUrl || "#"));
  const bgStyle = String(c.backgroundStyle || "gradient");
  const imageUrl = String(c.imageUrl || "");

  let bgClass = "lp-hero-gradient";
  let bgInline = "";
  if (bgStyle === "dark") {
    bgClass = "lp-hero-dark";
  } else if (bgStyle === "image" && imageUrl) {
    bgClass = "lp-hero-image";
    bgInline = `style="background-image: url('${esc(imageUrl)}')"`;
  } else if (bgStyle === "bold") {
    bgClass = "lp-hero-bold";
  } else if (bgStyle === "minimal") {
    bgClass = "lp-hero-minimal";
  }

  return `
  <section class="lp-hero ${bgClass}" ${bgInline}>
    ${bgStyle === "image" && imageUrl ? '<div class="lp-hero-overlay"></div>' : ""}
    <div class="lp-hero-content">
      <h1 class="lp-hero-heading">${heading}</h1>
      ${subheading ? `<p class="lp-hero-subheading">${subheading}</p>` : ""}
      ${buttonText ? `<div class="lp-hero-btn-wrap"><a href="${buttonUrl}" class="lp-btn lp-btn-hero">${buttonText}</a></div>` : ""}
    </div>
  </section>`;
}

function renderFeatures(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Features"));
  const items = Array.isArray(c.items) ? c.items : [];
  const icons: Record<string, string> = {
    check: "✓",
    star: "★",
    lightbulb: "💡",
    users: "👥",
    gift: "🎁",
    zap: "⚡",
    shield: "🛡",
    refresh: "🔄",
    globe: "🌐",
    heart: "❤",
    rocket: "🚀",
  };

  const itemsHtml = items
    .map(
      (item: Record<string, unknown>) => `
    <div class="lp-feature-card">
      <div class="lp-feature-icon">${icons[String(item.icon || "check")] || "✓"}</div>
      <h3 class="lp-feature-title">${esc(String(item.title || ""))}</h3>
      <p class="lp-feature-desc">${esc(String(item.description || ""))}</p>
    </div>`,
    )
    .join("");

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="lp-features-grid">${itemsHtml}</div>
    </div>
  </section>`;
}

function renderTestimonials(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "What People Say"));
  const items = Array.isArray(c.items) ? c.items : [];

  const itemsHtml = items
    .map(
      (item: Record<string, unknown>) => `
    <div class="lp-testimonial-card">
      <div class="lp-quote-mark">&ldquo;</div>
      <p class="lp-quote-text">${esc(String(item.quote || item.text || ""))}</p>
      <div class="lp-quote-author">
        <div class="lp-avatar">${esc(
          String(item.name || "?")
            .charAt(0)
            .toUpperCase(),
        )}</div>
        <div>
          <p class="lp-author-name">${esc(String(item.name || "Anonymous"))}</p>
          ${item.role ? `<p class="lp-author-role">${esc(String(item.role))}</p>` : ""}
        </div>
      </div>
    </div>`,
    )
    .join("");

  return `
  <section class="lp-section lp-bg-gray">
    <div class="lp-container">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="lp-testimonials-grid">${itemsHtml}</div>
    </div>
  </section>`;
}

function renderCTA(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Ready to Get Started?"));
  const description = esc(String(c.description || ""));
  const buttonText = esc(String(c.buttonText || "Get Started"));
  const buttonUrl = esc(String(c.buttonUrl || "#"));

  return `
  <section class="lp-cta-section">
    <div class="lp-container lp-text-center">
      <h2 class="lp-cta-heading">${heading}</h2>
      ${description ? `<p class="lp-cta-desc">${description}</p>` : ""}
      <a href="${buttonUrl}" class="lp-btn lp-btn-cta">${buttonText}</a>
    </div>
  </section>`;
}

function renderOptinForm(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Subscribe"));
  const description = esc(String(c.description || ""));
  const buttonText = esc(String(c.buttonText || "Subscribe"));
  const fields = Array.isArray(c.fields) ? c.fields : ["email"];
  const formId = String(c.formId || "");

  const fieldLabels: Record<string, string> = {
    email: "Email Address",
    first_name: "First Name",
    last_name: "Last Name",
    phone: "Phone Number",
    company: "Company",
  };

  const fieldsHtml = fields
    .map((field: unknown) => {
      const name = String(field);
      const label = fieldLabels[name] || name;
      const type =
        name === "email" ? "email" : name === "phone" ? "tel" : "text";
      const required = name === "email" ? "required" : "";
      return `
      <div class="lp-form-field">
        <label class="lp-label" for="lp-${name}">${esc(label)}</label>
        <input class="lp-input" type="${type}" id="lp-${name}" name="${name}" placeholder="${esc(label)}" ${required} />
      </div>`;
    })
    .join("");

  return `
  <section class="lp-section lp-bg-gray">
    <div class="lp-form-container">
      <div class="lp-form-card">
        <h2 class="lp-form-heading">${heading}</h2>
        ${description ? `<p class="lp-form-desc">${description}</p>` : ""}
        <form class="lp-optin-form" data-form-id="${esc(formId)}">
          ${fieldsHtml}
          <button type="submit" class="lp-btn lp-btn-submit">${buttonText}</button>
          <p class="lp-form-privacy">We respect your privacy. Unsubscribe at any time.</p>
        </form>
        <div class="lp-form-success" style="display:none">
          <div class="lp-success-icon">✓</div>
          <p class="lp-success-text">Thank you! You&rsquo;ve been subscribed.</p>
        </div>
      </div>
    </div>
  </section>`;
}

function renderVideo(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || ""));
  const videoUrl = String(c.videoUrl || "");
  const videoType = String(c.videoType || "youtube");

  let embedUrl = "";
  if (
    videoType === "youtube" ||
    videoUrl.includes("youtube.com") ||
    videoUrl.includes("youtu.be")
  ) {
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/,
    );
    if (match) embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}`;
  } else if (videoType === "vimeo" || videoUrl.includes("vimeo.com")) {
    const match = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
  }

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container-md">
      ${heading ? `<h2 class="lp-section-heading">${heading}</h2>` : ""}
      ${
        embedUrl
          ? `<div class="lp-video-wrap"><iframe src="${esc(embedUrl)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Video" loading="lazy"></iframe></div>`
          : '<div class="lp-video-placeholder"><span>▶</span><p>Video</p></div>'
      }
    </div>
  </section>`;
}

function renderGallery(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || ""));
  const images = Array.isArray(c.items)
    ? c.items
    : Array.isArray(c.images)
      ? c.images
      : [];
  const columns = Math.min(Number(c.columns || 3), 4);

  const imagesHtml = images
    .map((img: any, i: number) => {
      const url =
        typeof img === "string" ? img : String(img.url || img.image || "");
      const alt =
        typeof img === "string"
          ? `Image ${i + 1}`
          : String(img.alt || img.title || `Image ${i + 1}`);
      return url
        ? `<div class="lp-gallery-item"><img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" /></div>`
        : "";
    })
    .join("");

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container">
      ${heading ? `<h2 class="lp-section-heading">${heading}</h2>` : ""}
      <div class="lp-gallery-grid" style="grid-template-columns: repeat(${columns}, 1fr)">${imagesHtml}</div>
    </div>
  </section>`;
}

function renderCountdown(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Hurry! Offer Ends In"));
  const targetDate = esc(String(c.targetDate || ""));

  return `
  <section class="lp-section lp-bg-gray">
    <div class="lp-container lp-text-center">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="lp-countdown" data-target="${targetDate}">
        <div class="lp-countdown-unit"><span class="lp-cd-val" data-cd="days">00</span><span class="lp-cd-label">Days</span></div>
        <div class="lp-countdown-unit"><span class="lp-cd-val" data-cd="hours">00</span><span class="lp-cd-label">Hours</span></div>
        <div class="lp-countdown-unit"><span class="lp-cd-val" data-cd="mins">00</span><span class="lp-cd-label">Minutes</span></div>
        <div class="lp-countdown-unit"><span class="lp-cd-val" data-cd="secs">00</span><span class="lp-cd-label">Seconds</span></div>
      </div>
    </div>
  </section>`;
}

function renderFAQ(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Frequently Asked Questions"));
  const items = Array.isArray(c.items) ? c.items : [];

  const itemsHtml = items
    .map(
      (item: Record<string, unknown>, i: number) => `
    <div class="lp-faq-item" role="region" aria-labelledby="faq-q-${i}">
      <button class="lp-faq-toggle" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
        <span>${esc(String(item.question || `Question ${i + 1}`))}</span>
        <span class="lp-faq-arrow" aria-hidden="true">&#9662;</span>
      </button>
      <div class="lp-faq-answer" id="faq-a-${i}" role="region">${esc(String(item.answer || ""))}</div>
    </div>`,
    )
    .join("");

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container-sm">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="lp-faq-list" role="list">${itemsHtml}</div>
    </div>
  </section>`;
}

function renderPricing(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Pricing"));
  const plans = Array.isArray(c.plans) ? c.plans : [];

  const plansHtml = plans
    .map((plan: Record<string, unknown>) => {
      const highlighted = plan.highlighted === true;
      const features = Array.isArray(plan.features) ? plan.features : [];
      const featHtml = features
        .map(
          (f: unknown) =>
            `<li><span class="lp-check">✓</span> ${esc(String(f))}</li>`,
        )
        .join("");

      return `
    <div class="lp-pricing-card ${highlighted ? "lp-pricing-featured" : ""}">
      ${highlighted ? '<span class="lp-pricing-badge">Most Popular</span>' : ""}
      <h3 class="lp-pricing-name">${esc(String(plan.name || "Plan"))}</h3>
      <p class="lp-pricing-price">${esc(String(plan.price || "Free"))}</p>
      <ul class="lp-pricing-features">${featHtml}</ul>
      <a href="#" class="lp-btn ${highlighted ? "lp-btn-primary" : "lp-btn-outline"}">Choose ${esc(String(plan.name || "Plan"))}</a>
    </div>`;
    })
    .join("");

  const gridClass =
    plans.length <= 2 ? "lp-pricing-grid-narrow" : "lp-pricing-grid";
  return `
  <section class="lp-section lp-bg-gray">
    <div class="lp-container">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="${gridClass}">${plansHtml}</div>
    </div>
  </section>`;
}

function renderSocialProof(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || "Trusted By"));
  const stats = Array.isArray(c.stats) ? c.stats : [];

  const statsHtml = stats
    .map(
      (s: Record<string, unknown>) => `
    <div class="lp-stat">
      <span class="lp-stat-value">${esc(String(s.value || "0"))}</span>
      <span class="lp-stat-label">${esc(String(s.label || ""))}</span>
    </div>`,
    )
    .join("");

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container lp-text-center">
      <h2 class="lp-section-heading">${heading}</h2>
      <div class="lp-stats-grid">${statsHtml}</div>
    </div>
  </section>`;
}

function renderText(c: Record<string, unknown>): string {
  const heading = esc(String(c.heading || ""));
  const text = esc(String(c.text || c.body || ""));
  const paragraphs = text
    .split("\n")
    .map((line: string) => (line.trim() ? `<p>${line}</p>` : ""))
    .join("");

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container-sm lp-prose">
      ${heading ? `<h2>${heading}</h2>` : ""}
      ${paragraphs}
    </div>
  </section>`;
}

function renderImage(c: Record<string, unknown>): string {
  const url = String(c.url || c.imageUrl || "");
  const alt = esc(String(c.alt || "Image"));
  const caption = esc(String(c.caption || ""));

  if (!url) return "";

  return `
  <section class="lp-section lp-bg-light">
    <div class="lp-container-md">
      <figure>
        <img src="${esc(url)}" alt="${alt}" class="lp-full-image" loading="lazy" />
        ${caption ? `<figcaption class="lp-caption">${caption}</figcaption>` : ""}
      </figure>
    </div>
  </section>`;
}

// ============================================================================
// CSS — Dynamic with CSS Variables
// ============================================================================

function getBaseStyles(style: StyleConfig): string {
  const primary = style.primaryColor || "#2563eb";
  const secondary = style.secondaryColor || "#7c3aed";
  const headingColor = style.headingColor || "#111827";
  const bodyColor = style.bodyColor || "#4b5563";
  const bgColor = style.backgroundColor || "#ffffff";
  const headingFont =
    style.headingFont || "system-ui, -apple-system, sans-serif";
  const bodyFont = style.bodyFont || "system-ui, -apple-system, sans-serif";

  const radiusMap: Record<string, string> = {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  };
  const radius = radiusMap[style.borderRadius || "md"] || "0.5rem";

  // Derive lighter/darker variants from primary
  // We use CSS filter for hover states, and opacity for lighter backgrounds
  return `
    :root {
      --lp-primary: ${primary};
      --lp-secondary: ${secondary};
      --lp-heading: ${headingColor};
      --lp-body: ${bodyColor};
      --lp-bg: ${bgColor};
      --lp-heading-font: ${headingFont};
      --lp-body-font: ${bodyFont};
      --lp-radius: ${radius};
      --lp-radius-lg: calc(${radius} * 2);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--lp-body-font); color: var(--lp-body); line-height: 1.6; -webkit-font-smoothing: antialiased; background: var(--lp-bg); }
    .lp-main { min-height: 100vh; }
    img { max-width: 100%; height: auto; display: block; }
    a { text-decoration: none; color: inherit; }

    /* Containers */
    .lp-container { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
    .lp-container-md { max-width: 56rem; margin: 0 auto; padding: 0 1.5rem; }
    .lp-container-sm { max-width: 42rem; margin: 0 auto; padding: 0 1.5rem; }
    .lp-form-container { max-width: 32rem; margin: 0 auto; padding: 0 1.5rem; }
    .lp-text-center { text-align: center; }

    /* Section */
    .lp-section { padding: 4rem 1.5rem; }
    .lp-bg-light { background: var(--lp-bg); }
    .lp-bg-gray { background: #f9fafb; }
    .lp-bg-white { background: #fff; }
    .lp-section-heading { font-family: var(--lp-heading-font); font-size: 1.875rem; font-weight: 700; text-align: center; margin-bottom: 3rem; color: var(--lp-heading); }

    /* Hero */
    .lp-hero { position: relative; padding: 5rem 1.5rem; }
    .lp-hero-gradient { background: linear-gradient(135deg, var(--lp-primary), var(--lp-secondary)); color: #fff; }
    .lp-hero-bold { background: var(--lp-primary); color: #fff; }
    .lp-hero-dark { background: #111827; color: #fff; }
    .lp-hero-minimal { background: var(--lp-bg); color: var(--lp-heading); }
    .lp-hero-image { background-size: cover; background-position: center; color: #fff; }
    .lp-hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
    .lp-hero-content { position: relative; max-width: 56rem; margin: 0 auto; text-align: center; }
    .lp-hero-heading { font-family: var(--lp-heading-font); font-size: 2.5rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.025em; }
    .lp-hero-subheading { margin-top: 1.5rem; font-size: 1.25rem; opacity: 0.9; max-width: 40rem; margin-left: auto; margin-right: auto; }
    .lp-hero-btn-wrap { margin-top: 2.5rem; }

    /* Buttons */
    .lp-btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; border-radius: var(--lp-radius); cursor: pointer; transition: all 0.2s; border: none; font-size: 1rem; font-family: var(--lp-body-font); }
    .lp-btn-hero { background: #fff; color: var(--lp-primary); padding: 0.875rem 2.5rem; font-size: 1.125rem; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
    .lp-btn-hero:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
    .lp-btn-cta { background: #fff; color: var(--lp-primary); padding: 0.875rem 2.5rem; font-size: 1.125rem; }
    .lp-btn-cta:hover { transform: translateY(-1px); }
    .lp-btn-primary { background: var(--lp-primary); color: #fff; padding: 0.75rem 2rem; width: 100%; }
    .lp-btn-primary:hover { opacity: 0.9; }
    .lp-btn-outline { background: #f3f4f6; color: var(--lp-heading); padding: 0.75rem 2rem; border: 1px solid #e5e7eb; width: 100%; }
    .lp-btn-outline:hover { background: #e5e7eb; }
    .lp-btn-submit { background: var(--lp-primary); color: #fff; padding: 0.75rem 2rem; width: 100%; font-size: 1rem; border: none; cursor: pointer; border-radius: var(--lp-radius); font-weight: 600; font-family: var(--lp-body-font); }
    .lp-btn-submit:hover { opacity: 0.9; }
    .lp-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Features */
    .lp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .lp-feature-card { text-align: center; padding: 2rem; border-radius: var(--lp-radius-lg); border: 1px solid #e5e7eb; background: #fff; }
    .lp-feature-icon { width: 3rem; height: 3rem; border-radius: 50%; background: color-mix(in srgb, var(--lp-primary) 10%, white); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.25rem; }
    .lp-feature-title { font-family: var(--lp-heading-font); font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--lp-heading); }
    .lp-feature-desc { font-size: 0.875rem; color: var(--lp-body); }

    /* Testimonials */
    .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .lp-testimonial-card { background: #fff; border-radius: var(--lp-radius-lg); padding: 1.5rem; border: 1px solid #e5e7eb; }
    .lp-quote-mark { font-size: 2rem; color: var(--lp-primary); line-height: 1; margin-bottom: 0.75rem; }
    .lp-quote-text { color: var(--lp-body); font-style: italic; margin-bottom: 1rem; font-size: 0.9375rem; }
    .lp-quote-author { display: flex; align-items: center; gap: 0.75rem; }
    .lp-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: color-mix(in srgb, var(--lp-primary) 10%, white); display: flex; align-items: center; justify-content: center; color: var(--lp-primary); font-weight: 600; font-size: 0.875rem; }
    .lp-author-name { font-weight: 500; font-size: 0.875rem; color: var(--lp-heading); }
    .lp-author-role { font-size: 0.75rem; color: #9ca3af; }

    /* CTA */
    .lp-cta-section { padding: 4rem 1.5rem; background: var(--lp-primary); color: #fff; }
    .lp-cta-heading { font-family: var(--lp-heading-font); font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; }
    .lp-cta-desc { font-size: 1.125rem; opacity: 0.9; margin-bottom: 2rem; }

    /* Optin Form */
    .lp-form-card { background: #fff; border-radius: var(--lp-radius-lg); padding: 2.5rem; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .lp-form-heading { font-family: var(--lp-heading-font); font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem; color: var(--lp-heading); }
    .lp-form-desc { text-align: center; color: var(--lp-body); margin-bottom: 1.5rem; }
    .lp-form-field { margin-bottom: 1rem; }
    .lp-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; color: var(--lp-heading); }
    .lp-input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #d1d5db; border-radius: var(--lp-radius); font-size: 0.9375rem; font-family: var(--lp-body-font); outline: none; transition: border-color 0.15s; background: #fff; color: var(--lp-heading); }
    .lp-input:focus { border-color: var(--lp-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lp-primary) 10%, transparent); }
    .lp-form-privacy { text-align: center; font-size: 0.75rem; color: #9ca3af; margin-top: 0.75rem; }
    .lp-form-success { text-align: center; padding: 2rem 0; }
    .lp-success-icon { width: 3rem; height: 3rem; border-radius: 50%; background: #d1fae5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; }
    .lp-success-text { color: #065f46; font-weight: 500; }

    /* Video */
    .lp-video-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--lp-radius-lg); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .lp-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .lp-video-placeholder { aspect-ratio: 16/9; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: var(--lp-radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9ca3af; }

    /* Gallery */
    .lp-gallery-grid { display: grid; gap: 1rem; }
    .lp-gallery-item { aspect-ratio: 1; border-radius: var(--lp-radius); overflow: hidden; border: 1px solid #e5e7eb; }
    .lp-gallery-item img { width: 100%; height: 100%; object-fit: cover; }

    /* Countdown */
    .lp-countdown { display: flex; align-items: center; justify-content: center; gap: 1rem; }
    .lp-countdown-unit { background: #fff; border: 1px solid #e5e7eb; border-radius: var(--lp-radius-lg); padding: 1.25rem 1.5rem; min-width: 5rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .lp-cd-val { display: block; font-size: 2.5rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; color: var(--lp-heading); font-family: var(--lp-heading-font); }
    .lp-cd-label { display: block; font-size: 0.75rem; color: var(--lp-body); margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }

    /* FAQ */
    .lp-faq-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .lp-faq-item { border: 1px solid #e5e7eb; border-radius: var(--lp-radius); overflow: hidden; }
    .lp-faq-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 1rem 1.25rem; background: none; border: none; cursor: pointer; font-size: 0.9375rem; font-weight: 500; font-family: var(--lp-body-font); text-align: left; transition: background 0.15s; color: var(--lp-heading); }
    .lp-faq-toggle:hover { background: #f9fafb; }
    .lp-faq-arrow { transition: transform 0.3s; font-size: 0.875rem; color: #9ca3af; }
    .lp-faq-item.open .lp-faq-arrow { transform: rotate(180deg); }
    .lp-faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; padding: 0 1.25rem; font-size: 0.9375rem; color: var(--lp-body); line-height: 1.7; }
    .lp-faq-item.open .lp-faq-answer { max-height: 50rem; padding: 0 1.25rem 1.25rem; }

    /* Pricing */
    .lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .lp-pricing-grid-narrow { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 48rem; margin: 0 auto; }
    .lp-pricing-card { background: #fff; border-radius: var(--lp-radius-lg); border: 1px solid #e5e7eb; padding: 2rem; display: flex; flex-direction: column; }
    .lp-pricing-featured { border-color: var(--lp-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--lp-primary) 20%, transparent), 0 4px 12px rgba(0,0,0,0.05); transform: scale(1.02); }
    .lp-pricing-badge { font-size: 0.75rem; font-weight: 600; color: var(--lp-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .lp-pricing-name { font-family: var(--lp-heading-font); font-size: 1.25rem; font-weight: 700; color: var(--lp-heading); }
    .lp-pricing-price { font-size: 2rem; font-weight: 700; margin: 1rem 0 1.5rem; color: var(--lp-heading); }
    .lp-pricing-features { list-style: none; flex: 1; margin-bottom: 2rem; }
    .lp-pricing-features li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.75rem; color: var(--lp-body); }
    .lp-check { color: var(--lp-primary); flex-shrink: 0; margin-top: 0.125rem; }

    /* Social proof */
    .lp-stats-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 3rem; }
    .lp-stat { display: flex; flex-direction: column; align-items: center; }
    .lp-stat-value { font-size: 2.5rem; font-weight: 700; color: var(--lp-primary); font-family: var(--lp-heading-font); }
    .lp-stat-label { font-size: 0.875rem; color: var(--lp-body); margin-top: 0.25rem; }

    /* Text / Prose */
    .lp-prose p { margin-bottom: 1rem; color: var(--lp-body); }
    .lp-prose h2 { font-family: var(--lp-heading-font); font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--lp-heading); }

    /* Image */
    .lp-full-image { width: 100%; border-radius: var(--lp-radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    .lp-caption { text-align: center; font-size: 0.875rem; color: var(--lp-body); margin-top: 0.75rem; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .lp-features-grid { grid-template-columns: repeat(2, 1fr); }
      .lp-testimonials-grid { grid-template-columns: repeat(2, 1fr); }
      .lp-pricing-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .lp-hero { padding: 3.5rem 1.25rem; }
      .lp-hero-heading { font-size: 1.875rem; }
      .lp-hero-subheading { font-size: 1.0625rem; }
      .lp-section { padding: 3rem 1.25rem; }
      .lp-section-heading { font-size: 1.5rem; margin-bottom: 2rem; }
      .lp-features-grid { grid-template-columns: 1fr; }
      .lp-testimonials-grid { grid-template-columns: 1fr; }
      .lp-pricing-grid, .lp-pricing-grid-narrow { grid-template-columns: 1fr; }
      .lp-countdown { gap: 0.5rem; }
      .lp-countdown-unit { padding: 0.75rem 1rem; min-width: 4rem; }
      .lp-cd-val { font-size: 1.75rem; }
      .lp-stats-grid { gap: 2rem; }
      .lp-stat-value { font-size: 2rem; }
      .lp-cta-heading { font-size: 1.5rem; }
    }
    @media (max-width: 480px) {
      .lp-hero-heading { font-size: 1.5rem; }
      .lp-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    ${style.customCss || ""}
  `;
}

// ============================================================================
// CLIENT SCRIPT (for live pages — handles forms, countdown, FAQ)
// ============================================================================

function getClientScript(origin: string, pageId: string): string {
  return `
    // Countdown timer
    (function() {
      var el = document.querySelector('.lp-countdown');
      if (!el) return;
      var target = el.dataset.target;
      if (!target) return;
      var targetTime = new Date(target).getTime();
      if (isNaN(targetTime)) return;
      function update() {
        var diff = Math.max(0, targetTime - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        document.querySelectorAll('[data-cd="days"]').forEach(function(e){e.textContent=String(d).padStart(2,'0')});
        document.querySelectorAll('[data-cd="hours"]').forEach(function(e){e.textContent=String(h).padStart(2,'0')});
        document.querySelectorAll('[data-cd="mins"]').forEach(function(e){e.textContent=String(m).padStart(2,'0')});
        document.querySelectorAll('[data-cd="secs"]').forEach(function(e){e.textContent=String(s).padStart(2,'0')});
      }
      update();
      setInterval(update, 1000);
    })();

    // FAQ accordion
    document.querySelectorAll('.lp-faq-toggle').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var item = this.closest('.lp-faq-item');
        var isOpen = item.classList.contains('open');
        // Close all others (optional: accordion behavior)
        // item.parentElement.querySelectorAll('.lp-faq-item.open').forEach(function(el) { el.classList.remove('open'); });
        item.classList.toggle('open');
        this.setAttribute('aria-expanded', !isOpen);
      });
    });

    // Form submission
    document.querySelectorAll('.lp-optin-form').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var btn = this.querySelector('button[type="submit"]');
        var formId = this.dataset.formId;
        if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
        
        var data = {};
        new FormData(this).forEach(function(v, k) { data[k] = v; });
        
        var submitUrl = formId 
          ? '${esc(origin)}/api/marketing/forms/submit/' + encodeURIComponent(formId)
          : null;
        
        var self = this;
        if (submitUrl) {
          fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data, landingPageId: '${esc(pageId)}' })
          }).then(function(r) { return r.json(); }).then(function() {
            self.style.display = 'none';
            var success = self.parentElement.querySelector('.lp-form-success');
            if (success) success.style.display = 'block';
          }).catch(function() {
            if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
          });
        } else {
          self.style.display = 'none';
          var success = self.parentElement.querySelector('.lp-form-success');
          if (success) success.style.display = 'block';
        }
      });
    });
  `;
}

// ============================================================================
// PREVIEW SCRIPT (for iframe preview — no form submission, just interactivity)
// ============================================================================

function getPreviewScript(): string {
  return `
    // Countdown timer (visual only in preview)
    (function() {
      var el = document.querySelector('.lp-countdown');
      if (!el) return;
      var target = el.dataset.target;
      if (!target) return;
      var targetTime = new Date(target).getTime();
      if (isNaN(targetTime)) return;
      function update() {
        var diff = Math.max(0, targetTime - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        document.querySelectorAll('[data-cd="days"]').forEach(function(e){e.textContent=String(d).padStart(2,'0')});
        document.querySelectorAll('[data-cd="hours"]').forEach(function(e){e.textContent=String(h).padStart(2,'0')});
        document.querySelectorAll('[data-cd="mins"]').forEach(function(e){e.textContent=String(m).padStart(2,'0')});
        document.querySelectorAll('[data-cd="secs"]').forEach(function(e){e.textContent=String(s).padStart(2,'0')});
      }
      update();
      setInterval(update, 1000);
    })();

    // FAQ accordion
    document.querySelectorAll('.lp-faq-toggle').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var item = this.closest('.lp-faq-item');
        var isOpen = item.classList.contains('open');
        item.classList.toggle('open');
        this.setAttribute('aria-expanded', !isOpen);
      });
    });

    // Prevent form submission in preview
    document.querySelectorAll('.lp-optin-form').forEach(function(form) {
      form.addEventListener('submit', function(e) { e.preventDefault(); });
    });

    // Prevent link navigation in preview
    document.querySelectorAll('a[href]').forEach(function(a) {
      a.addEventListener('click', function(e) { e.preventDefault(); });
    });
  `;
}

// ============================================================================
// UTILITIES
// ============================================================================

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
