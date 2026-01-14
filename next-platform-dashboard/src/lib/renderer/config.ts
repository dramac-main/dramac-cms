export const RENDERER_CONFIG = {
  // Revalidation time for ISR (seconds)
  revalidateTime: 60,
  // Whether to use static generation
  staticGeneration: true,
  // Maximum pages to pre-render per site
  maxStaticPages: 100,
  // Fallback behavior
  fallback: "blocking" as const,
  // Cache headers
  cacheHeaders: {
    public: "public, max-age=60, s-maxage=3600",
    private: "private, no-cache",
    static: "public, max-age=31536000, immutable",
  },
};

export const RENDERER_DEFAULTS = {
  title: "Untitled Site",
  description: "",
  favicon: "/favicon.ico",
  ogImage: null,
};
