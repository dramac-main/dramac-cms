"use client";

import { useNode } from "@craftjs/core";
import { SocialLinksSettings } from "../settings/social-links-settings";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface SocialLinksProps {
  links?: SocialLink[];
  iconSize?: number;
  iconColor?: string;
  hoverColor?: string;
  gap?: number;
  alignment?: "left" | "center" | "right";
}

const defaultLinks: SocialLink[] = [
  { platform: "facebook", url: "#", icon: "📘" },
  { platform: "twitter", url: "#", icon: "🐦" },
  { platform: "instagram", url: "#", icon: "📷" },
  { platform: "linkedin", url: "#", icon: "💼" },
];

export function SocialLinks({
  links = defaultLinks,
  iconSize = 24,
  iconColor = "#1f2937",
  hoverColor = "#6366f1",
  gap = 16,
  alignment = "center",
}: SocialLinksProps) {
  const { connectors: { connect, drag } } = useNode();

  const alignmentMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        display: "flex",
        justifyContent: alignmentMap[alignment],
        gap: `${gap}px`,
        padding: "16px 0",
      }}
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          onClick={(e) => e.preventDefault()}
          style={{
            fontSize: `${iconSize}px`,
            color: iconColor,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = iconColor)}
          title={link.platform}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

SocialLinks.craft = {
  displayName: "Social Links",
  props: {
    links: defaultLinks,
    iconSize: 24,
    iconColor: "#1f2937",
    hoverColor: "#6366f1",
    gap: 16,
    alignment: "center",
  },
  related: {
    settings: SocialLinksSettings,
  },
};
