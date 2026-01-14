"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

export interface ImageComponentProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: string;
  className?: string;
}

export function ImageComponent({
  src = "",
  alt = "Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  borderRadius = "rounded-none",
  className = "",
}: ImageComponentProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  if (!src) {
    return (
      <div
        ref={(ref) => {
          if (ref) {
            connect(drag(ref));
          }
        }}
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30",
          borderRadius,
          className
        )}
        style={{ width, height: height === "auto" ? "200px" : height }}
      >
        <div className="text-center p-4">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Add an image URL</p>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      src={src}
      alt={alt}
      className={cn(borderRadius, className)}
      style={{
        width,
        height,
        objectFit,
      }}
    />
  );
}

ImageComponent.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "Image",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: "rounded-none",
    className: "",
  },
  related: {
    toolbar: () => import("../settings/image-settings").then((m) => m.ImageSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
