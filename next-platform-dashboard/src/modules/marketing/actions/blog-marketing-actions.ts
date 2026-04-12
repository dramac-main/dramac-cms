/**
 * Marketing Module - Blog Marketing Actions
 *
 * Phase MKT-07: Blog Marketing Enhancement
 *
 * Server actions for content-to-email conversion,
 * blog auto-share, and blog marketing utilities.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";
import type { Campaign } from "../types/campaign-types";
import type {
  EmailBlock,
  BlogToEmailResult,
} from "../types/blog-marketing-types";

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ============================================================================
// CONTENT-TO-EMAIL CONVERSION
// ============================================================================

/**
 * Convert blog post HTML content into structured email blocks.
 */
export function blogHtmlToEmailBlocks(
  contentHtml: string,
  featuredImageUrl: string | null,
  postTitle: string,
  postUrl: string,
): BlogToEmailResult {
  const blocks: EmailBlock[] = [];

  // Header block with post title
  blocks.push({
    type: "header",
    content: postTitle,
    metadata: { level: 1 },
  });

  // Featured image block
  if (featuredImageUrl) {
    blocks.push({
      type: "image",
      content: featuredImageUrl,
      metadata: { alt: postTitle, width: "100%" },
    });
  }

  // Divider after header
  blocks.push({ type: "divider", content: "" });

  // Parse HTML content into text blocks
  // Split by major HTML block elements
  const htmlContent = contentHtml || "";
  const blockRegex =
    /<(h[1-6]|p|blockquote|ul|ol|img)[^>]*>([\s\S]*?)<\/\1>|<img[^>]*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(htmlContent)) !== null) {
    const tagName = (match[1] || "").toLowerCase();
    const innerContent = match[2] || "";

    if (tagName.startsWith("h")) {
      blocks.push({
        type: "header",
        content: stripHtml(innerContent),
        metadata: { level: parseInt(tagName[1]) },
      });
    } else if (tagName === "img" || match[0].startsWith("<img")) {
      const src = extractAttribute(match[0], "src");
      const alt = extractAttribute(match[0], "alt");
      if (src) {
        blocks.push({
          type: "image",
          content: src,
          metadata: { alt: alt || "" },
        });
      }
    } else if (
      tagName === "p" ||
      tagName === "blockquote" ||
      tagName === "ul" ||
      tagName === "ol"
    ) {
      const text = stripHtml(innerContent).trim();
      if (text) {
        blocks.push({
          type: "text",
          content: innerContent, // Keep HTML for formatting
          metadata: { tag: tagName },
        });
      }
    }
  }

  // If no blocks parsed (simple HTML), add the whole content as text
  if (blocks.length <= (featuredImageUrl ? 3 : 2)) {
    const stripped = stripHtml(htmlContent).trim();
    if (stripped) {
      blocks.push({
        type: "text",
        content: htmlContent,
      });
    }
  }

  // "Read full post" CTA button
  blocks.push({
    type: "button",
    content: "Read the Full Post",
    metadata: { url: postUrl, align: "center" },
  });

  // Footer
  blocks.push({
    type: "footer",
    content:
      "You received this email because you subscribed to our blog. Unsubscribe anytime.",
  });

  // Generate preview text from first text block
  const firstTextBlock = blocks.find((b) => b.type === "text");
  const previewText = firstTextBlock
    ? stripHtml(firstTextBlock.content).slice(0, 150).trim() + "..."
    : `New post: ${postTitle}`;

  // Generate simple HTML email from blocks
  const emailHtml = blocksToHtml(blocks, postTitle);

  return {
    subjectLine: postTitle,
    previewText,
    blocks,
    contentHtml: emailHtml,
  };
}

/**
 * Convert a blog post into a draft email campaign.
 */
export async function convertBlogToEmail(
  blogPostId: string,
  siteId: string,
): Promise<Campaign> {
  const supabase = await getModuleClient();

  // Fetch the blog post
  const { data: post, error: postError } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, content_html, featured_image_url, meta_description",
    )
    .eq("id", blogPostId)
    .single();

  if (postError || !post) {
    throw new Error("Blog post not found");
  }

  // Get site for URL construction
  const { data: site } = await supabase
    .from("sites")
    .select("subdomain, custom_domain, custom_domain_verified")
    .eq("id", siteId)
    .single();

  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";
  const host =
    site?.custom_domain && site?.custom_domain_verified
      ? site.custom_domain
      : `${site?.subdomain || "site"}.${baseDomain}`;
  const postUrl = `https://${host}/blog/${post.slug}`;

  // Convert to email blocks
  const emailResult = blogHtmlToEmailBlocks(
    post.content_html || "",
    post.featured_image_url || null,
    post.title,
    postUrl,
  );

  // Create draft campaign
  const { data: campaign, error: campaignError } = await supabase
    .from(MKT_TABLES.campaigns)
    .insert({
      site_id: siteId,
      name: `Blog: ${post.title}`,
      type: "email",
      status: "draft",
      subject_line: emailResult.subjectLine,
      preview_text: emailResult.previewText,
      content_html: emailResult.contentHtml,
      content_json: { blocks: emailResult.blocks },
      ab_test_enabled: false,
      total_recipients: 0,
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_clicked: 0,
      total_bounced: 0,
      total_unsubscribed: 0,
      total_complained: 0,
      revenue_attributed: 0,
      tags: ["blog-email", "auto-generated"],
      metadata: {
        source: "blog_to_email",
        blogPostId: post.id,
        blogPostSlug: post.slug,
        blogPostUrl: postUrl,
      },
    })
    .select()
    .single();

  if (campaignError) {
    throw new Error(`Failed to create campaign: ${campaignError.message}`);
  }

  return campaign as Campaign;
}

// ============================================================================
// BLOG DIGEST / AUTO-SHARE
// ============================================================================

/**
 * Create a blog digest email campaign from recent published posts.
 * Used by the blog auto-share system to send weekly/daily digests.
 */
export async function createBlogDigestCampaign(
  siteId: string,
  options?: {
    since?: string; // ISO date — only include posts published after this
    maxPosts?: number;
    audienceId?: string;
  },
): Promise<Campaign> {
  const supabase = await getModuleClient();
  const since =
    options?.since ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const maxPosts = options?.maxPosts || 5;

  // Fetch recent published posts
  const { data: posts, error: postsError } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, featured_image_url, published_at")
    .eq("site_id", siteId)
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(maxPosts);

  if (postsError) {
    throw new Error(`Failed to fetch posts: ${postsError.message}`);
  }

  if (!posts || posts.length === 0) {
    throw new Error("No recent posts found for digest");
  }

  // Get site info for URLs
  const { data: site } = await supabase
    .from("sites")
    .select("name, subdomain, custom_domain, custom_domain_verified")
    .eq("id", siteId)
    .single();

  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";
  const host =
    site?.custom_domain && site?.custom_domain_verified
      ? site.custom_domain
      : `${site?.subdomain || "site"}.${baseDomain}`;
  const blogUrl = `https://${host}/blog`;

  // Build digest email HTML
  const digestHtml = buildDigestHtml(
    site?.name || "Our Blog",
    blogUrl,
    posts.map((p: Record<string, unknown>) => ({
      title: p.title as string,
      excerpt: (p.excerpt as string) || "",
      url: `${blogUrl}/${p.slug}`,
      imageUrl: (p.featured_image_url as string) || null,
      publishedAt: p.published_at as string,
    })),
  );

  // Create campaign
  const postCount = posts.length;
  const { data: campaign, error: campaignError } = await supabase
    .from(MKT_TABLES.campaigns)
    .insert({
      site_id: siteId,
      name: `Blog Digest: ${postCount} New Post${postCount > 1 ? "s" : ""}`,
      type: "email",
      status: "draft",
      subject_line: `${postCount} New Post${postCount > 1 ? "s" : ""} from ${site?.name || "Our Blog"}`,
      preview_text: posts
        .map((p: Record<string, unknown>) => p.title)
        .join(" | "),
      content_html: digestHtml,
      content_json: {
        type: "blog_digest",
        postIds: posts.map((p: Record<string, unknown>) => p.id),
        generatedAt: new Date().toISOString(),
      },
      audience_id: options?.audienceId || null,
      ab_test_enabled: false,
      total_recipients: 0,
      total_sent: 0,
      total_delivered: 0,
      total_opened: 0,
      total_clicked: 0,
      total_bounced: 0,
      total_unsubscribed: 0,
      total_complained: 0,
      revenue_attributed: 0,
      tags: ["blog-digest", "auto-generated"],
      metadata: {
        source: "blog_digest",
        postCount,
        sinceDateFilter: since,
      },
    })
    .select()
    .single();

  if (campaignError) {
    throw new Error(
      `Failed to create digest campaign: ${campaignError.message}`,
    );
  }

  return campaign as Campaign;
}

function buildDigestHtml(
  siteName: string,
  blogUrl: string,
  posts: {
    title: string;
    excerpt: string;
    url: string;
    imageUrl: string | null;
    publishedAt: string;
  }[],
): string {
  const postCards = posts
    .map(
      (post) => `
    <div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #e5e5e5">
      ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px"/>` : ""}
      <h2 style="font-size:18px;margin:0 0 8px"><a href="${escapeHtml(post.url)}" style="color:#4F46E5;text-decoration:none">${escapeHtml(post.title)}</a></h2>
      <p style="margin:0 0 8px;color:#666;font-size:12px">${new Date(post.publishedAt).toLocaleDateString()}</p>
      ${post.excerpt ? `<p style="margin:0 0 12px;line-height:1.6;color:#333">${escapeHtml(post.excerpt)}</p>` : ""}
      <a href="${escapeHtml(post.url)}" style="color:#4F46E5;font-size:14px;font-weight:600;text-decoration:none">Read more &rarr;</a>
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Blog Digest</title>
<style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#333;background:#f5f5f5}</style>
</head><body>
<div style="max-width:600px;margin:0 auto;background:#fff;padding:32px">
  <h1 style="font-size:24px;margin:0 0 8px">${escapeHtml(siteName)} — Latest Posts</h1>
  <p style="color:#666;margin:0 0 24px;font-size:14px">Here's what we've been writing about recently.</p>
  ${postCards}
  <div style="text-align:center;margin-top:24px">
    <a href="${escapeHtml(blogUrl)}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View All Posts</a>
  </div>
  <div style="text-align:center;font-size:12px;color:#999;margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5">
    You received this because you subscribed to our blog. Unsubscribe anytime.
  </div>
</div>
</body></html>`;
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
    .trim();
}

function extractAttribute(tag: string, attr: string): string {
  const regex = new RegExp(`${attr}=["']([^"']*)["']`, "i");
  const match = regex.exec(tag);
  return match ? match[1] : "";
}

function blocksToHtml(blocks: EmailBlock[], title: string): string {
  const parts: string[] = [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    '<style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#333;background:#f5f5f5}',
    ".container{max-width:600px;margin:0 auto;background:#fff;padding:32px}",
    "h1{font-size:24px;margin:0 0 16px}h2{font-size:20px;margin:24px 0 12px}h3{font-size:16px;margin:20px 0 8px}",
    "p{margin:0 0 12px;line-height:1.6}img{max-width:100%;height:auto;border-radius:8px}",
    ".btn{display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:600}",
    ".divider{border:0;border-top:1px solid #e5e5e5;margin:24px 0}",
    ".footer{text-align:center;font-size:12px;color:#999;margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5}",
    "</style></head><body><div class='container'>",
  ];

  for (const block of blocks) {
    switch (block.type) {
      case "header": {
        const level = (block.metadata?.level as number) || 1;
        const tag = `h${Math.min(level, 6)}`;
        parts.push(`<${tag}>${escapeHtml(block.content)}</${tag}>`);
        break;
      }
      case "image":
        parts.push(
          `<p><img src="${escapeHtml(block.content)}" alt="${escapeHtml((block.metadata?.alt as string) || "")}" style="max-width:100%;border-radius:8px"/></p>`,
        );
        break;
      case "text":
        // Content may already be HTML from the blog
        parts.push(`<div>${block.content}</div>`);
        break;
      case "button":
        parts.push(
          `<p style="text-align:${(block.metadata?.align as string) || "center"};margin:24px 0"><a href="${escapeHtml((block.metadata?.url as string) || "#")}" class="btn">${escapeHtml(block.content)}</a></p>`,
        );
        break;
      case "divider":
        parts.push('<hr class="divider"/>');
        break;
      case "footer":
        parts.push(`<div class="footer">${escapeHtml(block.content)}</div>`);
        break;
    }
  }

  parts.push("</div></body></html>");
  return parts.join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
