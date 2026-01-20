"use client";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface RenderSocialLinksProps {
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

export function RenderSocialLinks({
  links = defaultLinks,
  iconSize = 24,
  iconColor = "#1f2937",
  hoverColor = "#6366f1",
  gap = 16,
  alignment = "center",
}: RenderSocialLinksProps) {
  const alignmentMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <div
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
          style={{
            fontSize: `${iconSize}px`,
            color: iconColor,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          title={link.platform}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
