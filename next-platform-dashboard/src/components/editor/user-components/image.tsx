"use client";

import { useNode } from "@craftjs/core";
import { ImageIcon } from "lucide-react";
import { ImageSettingsNew } from "../settings/image-settings-new";

interface ImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: number;
}

export function Image({
  src = "",
  alt = "Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  borderRadius = 0,
}: ImageProps) {
  const { connectors: { connect, drag } } = useNode();

  if (!src) {
    return (
      <div
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          width,
          height: height === "auto" ? "200px" : height,
          backgroundColor: "#f3f4f6",
          borderRadius: `${borderRadius}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          border: "2px dashed #d1d5db",
        }}
      >
        <ImageIcon style={{ width: "40px", height: "40px", marginBottom: "8px" }} />
        <span>Add an image URL</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      src={src}
      alt={alt}
      style={{
        width,
        height,
        objectFit,
        borderRadius: `${borderRadius}px`,
        display: "block",
      }}
    />
  );
}

Image.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "Image",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: 0,
  },
  related: {
    settings: ImageSettingsNew,
  },
};
