/**
 * Puck Media Components
 * 
 * Media components for images, videos, and maps.
 */

import type { ImageProps, VideoProps, MapProps } from "@/types/puck";
import { cn } from "@/lib/utils";
import { ImageIcon, PlayCircle, MapPin } from "lucide-react";

// Border radius utilities
const radiusMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

// Aspect ratio utilities
const aspectRatioMap: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

/**
 * Image Component
 * Display images with configurable sizing and styling.
 */
export function ImageRender({
  src,
  alt = "",
  width = "full",
  fixedWidth = 400,
  height = "auto",
  fixedHeight = 300,
  objectFit = "cover",
  borderRadius = "none",
}: ImageProps) {
  const widthStyle =
    width === "full"
      ? "100%"
      : width === "fixed"
      ? `${fixedWidth}px`
      : "auto";

  const heightStyle =
    height === "fixed" ? `${fixedHeight}px` : "auto";

  // Show placeholder if no source
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          radiusMap[borderRadius || "none"]
        )}
        style={{
          width: widthStyle,
          height: height === "fixed" ? heightStyle : "200px",
        }}
      >
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(radiusMap[borderRadius || "none"])}
      style={{
        width: widthStyle,
        height: heightStyle,
        objectFit: objectFit,
      }}
    />
  );
}

/**
 * Video Component
 * Embed videos from YouTube, Vimeo, or direct files.
 */
export function VideoRender({
  url,
  type = "youtube",
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  aspectRatio = "16:9",
}: VideoProps) {
  // Show placeholder if no URL
  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          aspectRatioMap[aspectRatio || "16:9"]
        )}
      >
        <PlayCircle className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  // Extract video ID for embeds
  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  if (type === "youtube") {
    const videoId = getYouTubeId(url);
    if (!videoId) return <div className="text-destructive">Invalid YouTube URL</div>;

    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      loop: loop ? "1" : "0",
      controls: controls ? "1" : "0",
    });

    return (
      <div className={cn("w-full", aspectRatioMap[aspectRatio || "16:9"])}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (type === "vimeo") {
    const videoId = getVimeoId(url);
    if (!videoId) return <div className="text-destructive">Invalid Vimeo URL</div>;

    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      muted: muted ? "1" : "0",
      loop: loop ? "1" : "0",
    });

    return (
      <div className={cn("w-full", aspectRatioMap[aspectRatio || "16:9"])}>
        <iframe
          className="h-full w-full"
          src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct file embed
  return (
    <div className={cn("w-full", aspectRatioMap[aspectRatio || "16:9"])}>
      <video
        className="h-full w-full object-cover"
        src={url}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
      />
    </div>
  );
}

/**
 * Map Component
 * Display a Google Maps embed.
 */
export function MapRender({
  address,
  latitude = 0,
  longitude = 0,
  zoom = 15,
  height = 400,
  style = "roadmap",
}: MapProps) {
  // Show placeholder if no location
  if (!address && !latitude && !longitude) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-md"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            Enter an address or coordinates
          </p>
        </div>
      </div>
    );
  }

  // Build map URL
  const query = address
    ? encodeURIComponent(address)
    : `${latitude},${longitude}`;

  const mapTypeMap: Record<string, string> = {
    roadmap: "roadmap",
    satellite: "satellite",
    hybrid: "hybrid",
    terrain: "terrain",
  };

  // Using OpenStreetMap as default (Google requires API key)
  // In production, you'd use Google Maps with API key
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.01
  }%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${
    latitude + 0.01
  }&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <div className="rounded-md overflow-hidden" style={{ height: `${height}px` }}>
      <iframe
        className="w-full h-full border-0"
        src={mapUrl}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
