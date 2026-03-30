/**
 * Media Quality Scoring for AI-generated websites
 * Phase 5.1: Scores how well media is used across a generated page
 */

export interface MediaQualityResult {
  score: number;
  issues: string[];
}

interface ImageInfo {
  alt?: string;
  src?: string;
  loading?: string;
  priority?: boolean;
}

interface VideoInfo {
  src?: string;
  poster?: string;
  thumbnail?: string;
}

interface GalleryInfo {
  images: any[];
}

interface MapInfo {
  address?: string;
  lat?: number;
  latitude?: number;
}

interface PageMedia {
  /** All image components on the page */
  allImages: ImageInfo[];
  /** Hero section metadata */
  heroSection?: {
    hasImage: boolean;
    hasVideo: boolean;
  };
  /** Images that appear above the fold */
  aboveFoldImages: ImageInfo[];
  /** All video components on the page */
  allVideos: VideoInfo[];
  /** All gallery components on the page */
  allGalleries: GalleryInfo[];
  /** All map components on the page */
  allMaps: MapInfo[];
}

/**
 * Score the media quality of a generated page.
 * Returns a score from 0-100 and a list of issues found.
 */
export function scoreMediaQuality(page: PageMedia): MediaQualityResult {
  let score = 100;
  const issues: string[] = [];

  // Rule: Every image must have meaningful alt text
  page.allImages.forEach((img) => {
    if (!img.alt || img.alt === "" || img.alt === "image" || img.alt === "Image") {
      score -= 5;
      issues.push(`Image missing meaningful alt text: "${img.alt || "none"}"`);
    }
  });

  // Rule: Hero must have visual media
  if (page.heroSection && !page.heroSection.hasImage && !page.heroSection.hasVideo) {
    score -= 15;
    issues.push("Hero section has no visual media");
  }

  // Rule: Above-fold images should use priority loading
  page.aboveFoldImages.forEach((img) => {
    if (img.loading !== "eager" && !img.priority) {
      score -= 5;
      issues.push("Above-fold image not using priority/eager loading");
    }
  });

  // Rule: Videos should have poster images
  page.allVideos.forEach((video) => {
    if (!video.poster && !video.thumbnail) {
      score -= 10;
      issues.push("Video missing poster/thumbnail image");
    }
  });

  // Rule: Galleries should have consistent image count
  page.allGalleries.forEach((gallery) => {
    if (gallery.images.length < 4) {
      score -= 10;
      issues.push(
        `Gallery has only ${gallery.images.length} images — need at least 4`
      );
    }
  });

  // Rule: Maps must have address context
  page.allMaps.forEach((map) => {
    if (!map.address && !map.lat && !map.latitude) {
      score -= 10;
      issues.push("Map has no address or coordinates");
    }
  });

  return { score: Math.max(0, score), issues };
}

/**
 * Extract media info from a list of page components for scoring.
 * Accepts the raw component array from the AI converter output.
 */
export function extractPageMedia(
  components: Array<{ type: string; props?: Record<string, any> }>
): PageMedia {
  const allImages: ImageInfo[] = [];
  const allVideos: VideoInfo[] = [];
  const allGalleries: GalleryInfo[] = [];
  const allMaps: MapInfo[] = [];
  let heroSection: PageMedia["heroSection"] | undefined;
  const aboveFoldImages: ImageInfo[] = [];

  components.forEach((comp, index) => {
    const props = comp.props || {};

    switch (comp.type) {
      case "Image":
        allImages.push({
          alt: props.alt,
          src: props.src,
          loading: props.loading,
          priority: props.priority,
        });
        // First 2 components are likely above-fold
        if (index < 2) {
          aboveFoldImages.push({
            alt: props.alt,
            src: props.src,
            loading: props.loading,
            priority: props.priority,
          });
        }
        break;
      case "Video":
        allVideos.push({
          src: props.src,
          poster: props.poster,
          thumbnail: props.thumbnail,
        });
        break;
      case "Gallery":
        allGalleries.push({
          images: props.images || props.items || [],
        });
        break;
      case "Map":
        allMaps.push({
          address: props.address,
          lat: props.latitude || props.lat,
        });
        break;
      case "Hero":
        heroSection = {
          hasImage: Boolean(props.backgroundImage || props.image || props.src),
          hasVideo: Boolean(props.videoSrc || props.backgroundVideo),
        };
        break;
    }
  });

  return {
    allImages,
    heroSection,
    aboveFoldImages,
    allVideos,
    allGalleries,
    allMaps,
  };
}
