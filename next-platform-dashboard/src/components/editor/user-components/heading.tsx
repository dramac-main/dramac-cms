"use client";

import { useNode } from "@craftjs/core";
import { HeadingSettings } from "../settings/heading-settings";

interface HeadingProps {
  text?: string;
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
}

const fontSizeDefaults: Record<string, number> = {
  h1: 48,
  h2: 36,
  h3: 30,
  h4: 24,
  h5: 20,
  h6: 16,
};

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export function Heading({
  text = "Heading",
  level = "h2",
  fontSize,
  fontWeight = "bold",
  color = "#1f2937",
  textAlign = "left",
  marginTop = 0,
  marginBottom = 16,
}: HeadingProps) {
  const { connectors: { connect, drag } } = useNode();

  const Tag = level;
  const actualFontSize = fontSize || fontSizeDefaults[level];

  return (
    <Tag
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        fontSize: `${actualFontSize}px`,
        fontWeight: fontWeightMap[fontWeight],
        color,
        textAlign,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        lineHeight: 1.2,
      }}
    >
      {text}
    </Tag>
  );
}

Heading.craft = {
  displayName: "Heading",
  props: {
    text: "Heading",
    level: "h2",
    fontSize: undefined,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "left",
    marginTop: 0,
    marginBottom: 16,
  },
  related: {
    settings: HeadingSettings,
  },
};
