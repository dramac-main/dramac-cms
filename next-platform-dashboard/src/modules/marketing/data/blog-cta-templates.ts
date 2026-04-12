/**
 * Marketing Module - Blog CTA Templates
 *
 * Phase MKT-07: Pre-built CTA templates for blog posts
 */

import type { BlogCTATemplate } from "../types/blog-marketing-types";

export const BLOG_CTA_TEMPLATES: BlogCTATemplate[] = [
  {
    id: "subscribe-newsletter",
    name: "Subscribe to Newsletter",
    description: "Encourage readers to subscribe to your newsletter",
    style: "banner",
    heading: "Stay in the Loop",
    body: "Get the latest articles, tips, and updates delivered straight to your inbox. No spam, ever.",
    buttonText: "Subscribe Now",
    position: "end_of_post",
  },
  {
    id: "download-guide",
    name: "Download Free Guide",
    description: "Offer a free downloadable resource to capture leads",
    style: "card",
    heading: "Free Guide: Get Started Today",
    body: "Download our comprehensive guide and learn the strategies that top professionals use.",
    buttonText: "Download Free",
    position: "after_paragraph_5",
  },
  {
    id: "book-consultation",
    name: "Book a Consultation",
    description: "Drive readers to book a meeting or consultation",
    style: "card",
    heading: "Need Expert Help?",
    body: "Book a free 30-minute consultation with our team and get personalized advice for your business.",
    buttonText: "Book Now",
    position: "end_of_post",
  },
  {
    id: "related-product",
    name: "Related Product",
    description: "Promote a related product or service within the post",
    style: "inline",
    heading: "You Might Also Like",
    body: "Check out our latest product designed to help you achieve better results.",
    buttonText: "Learn More",
    position: "after_paragraph_2",
  },
  {
    id: "share-post",
    name: "Share This Post",
    description: "Encourage social sharing of the blog content",
    style: "banner",
    heading: "Found This Helpful?",
    body: "Share this article with your network and help others discover these insights.",
    buttonText: "Share Now",
    position: "end_of_post",
  },
];

export const DEFAULT_SUBSCRIBE_CONFIG = {
  enabled: false,
  heading: "Subscribe to Our Blog",
  description:
    "Get notified when we publish new content. No spam, unsubscribe anytime.",
  buttonText: "Subscribe",
  placement: "below_post" as const,
  formId: null,
  listId: null,
  autoTagSubscribers: ["blog-subscriber"],
  showOnAllPosts: true,
  excludeCategories: [],
};
