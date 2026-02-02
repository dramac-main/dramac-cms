"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { HeroSettings } from "../settings/hero-settings";

// ImageValue type for Wave 3 advanced field system
type ImageValue = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

// Helper to extract URL from string or ImageValue object
function extractImageUrl(src: string | ImageValue | undefined): string {
  if (!src) return "";
  if (typeof src === "string") return src;
  if (typeof src === "object" && "url" in src) return src.url || "";
  return "";
}

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImage?: string | ImageValue;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function HeroSection({
  title = "Welcome to Our Platform",
  subtitle = "Build beautiful websites with our drag-and-drop editor",
  buttonText = "Get Started",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buttonHref = "#",
  backgroundImage = "",
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
  alignment = "center",
  height = "min-h-[500px]",
  overlay = true,
  overlayOpacity = 50,
}: HeroSectionProps) {
  const {
    connectors: { connect, drag },
  } = useNode();
  
  // Extract URL from ImageValue or string
  const bgImageUrl = extractImageUrl(backgroundImage);

  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={cn(
        "relative flex flex-col justify-center px-8 py-16",
        height,
        alignmentClasses[alignment]
      )}
      style={{
        backgroundColor: bgImageUrl ? "transparent" : backgroundColor,
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Overlay */}
      {overlay && bgImageUrl && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
          {title}
        </h1>
        <p className="text-lg md:text-xl opacity-90">
          {subtitle}
        </p>
        {buttonText && (
          <button
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            {buttonText}
          </button>
        )}
      </div>
    </section>
  );
}

HeroSection.craft = {
  displayName: "Hero Section",
  props: {
    title: "Welcome to Our Platform",
    subtitle: "Build beautiful websites with our drag-and-drop editor",
    buttonText: "Get Started",
    buttonHref: "#",
    backgroundImage: "",
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
    alignment: "center",
    height: "min-h-[500px]",
    overlay: true,
    overlayOpacity: 50,
  },
  related: {
    settings: HeroSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
