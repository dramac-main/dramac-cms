"use client";

import { useNode } from "@craftjs/core";
import { VideoSettings } from "../settings/video-settings";
import { Play } from "lucide-react";

interface VideoProps {
  url?: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16";
}

const aspectRatioMap = {
  "16:9": "56.25%",
  "4:3": "75%",
  "1:1": "100%",
  "9:16": "177.78%",
};

function getEmbedUrl(url: string): string | null {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  return null;
}

export function Video({
  url = "",
  title = "Video",
  autoplay = false,
  muted = true,
  controls = true,
  aspectRatio = "16:9",
}: VideoProps) {
  const { connectors: { connect, drag } } = useNode();

  const embedUrl = url ? getEmbedUrl(url) : null;
  const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);

  if (!url) {
    return (
      <div
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          position: "relative",
          paddingBottom: aspectRatioMap[aspectRatio],
          backgroundColor: "#1f2937",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          <Play style={{ width: "48px", height: "48px", marginBottom: "8px" }} />
          <span>Add a video URL</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        position: "relative",
        paddingBottom: aspectRatioMap[aspectRatio],
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {isDirectVideo ? (
        <video
          src={url}
          title={title}
          autoPlay={autoplay}
          muted={muted}
          controls={controls}
          loop
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : embedUrl ? (
        <iframe
          src={`${embedUrl}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&controls=${controls ? 1 : 0}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1f2937",
            color: "#9ca3af",
          }}
        >
          Invalid video URL
        </div>
      )}
    </div>
  );
}

Video.craft = {
  displayName: "Video",
  props: {
    url: "",
    title: "Video",
    autoplay: false,
    muted: true,
    controls: true,
    aspectRatio: "16:9",
  },
  related: {
    settings: VideoSettings,
  },
};
