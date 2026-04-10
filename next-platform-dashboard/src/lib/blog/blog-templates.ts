import type { PublicBlogPost } from "./blog-api";

/**
 * Create a Studio page JSON template for the blog listing page.
 * This is rendered by the site renderer as a virtual page.
 */
export function createBlogListingTemplate(
  posts: PublicBlogPost[],
  siteInfo: { name: string; subdomain: string | null },
) {
  const sectionId = "blog-listing-section";

  return {
    root: { children: [sectionId] },
    components: {
      [sectionId]: {
        id: sectionId,
        type: "BlogListingSection",
        parentId: "root",
        props: {
          posts: posts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            featuredImageUrl: p.featuredImageUrl,
            featuredImageAlt: p.featuredImageAlt,
            authorName: p.authorName,
            publishedAt: p.publishedAt,
            readingTimeMinutes: p.readingTimeMinutes,
            isFeatured: p.isFeatured,
            categories: p.categories,
          })),
          siteName: siteInfo.name,
          siteSubdomain: siteInfo.subdomain,
        },
      },
    },
  };
}

/**
 * Create a Studio page JSON template for a single blog post page.
 * This is rendered by the site renderer as a virtual page.
 */
export function createBlogPostTemplate(
  post: PublicBlogPost,
  relatedPosts: PublicBlogPost[],
) {
  const sectionId = "blog-post-view";

  return {
    root: { children: [sectionId] },
    components: {
      [sectionId]: {
        id: sectionId,
        type: "BlogPostView",
        parentId: "root",
        props: {
          post: {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            contentHtml: post.contentHtml,
            featuredImageUrl: post.featuredImageUrl,
            featuredImageAlt: post.featuredImageAlt,
            authorName: post.authorName,
            authorAvatarUrl: post.authorAvatarUrl,
            publishedAt: post.publishedAt,
            readingTimeMinutes: post.readingTimeMinutes,
            isFeatured: post.isFeatured,
            categories: post.categories,
            tags: post.tags,
          },
          relatedPosts: relatedPosts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            featuredImageUrl: p.featuredImageUrl,
            publishedAt: p.publishedAt,
            readingTimeMinutes: p.readingTimeMinutes,
            categories: p.categories,
          })),
        },
      },
    },
  };
}
