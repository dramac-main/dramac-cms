"use client";

interface BlogWidgetProps {
  settings: Record<string, unknown>;
}

export default function BlogWidget({ settings }: BlogWidgetProps) {
  const postsPerPage = (settings.postsPerPage as number) || 10;
  
  // This would fetch and display recent blog posts
  // Placeholder for now
  return null;
}
