"use client";

import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";
import { Container } from "./container";
import { Text } from "./text";
import { SectionSettings } from "../settings/section-settings";

interface SectionProps {
  children?: ReactNode;
  backgroundColor?: string;
  backgroundImage?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  maxWidth?: "full" | "7xl" | "6xl" | "5xl" | "4xl" | "3xl" | "2xl" | "xl";
  minHeight?: number;
  className?: string;
}

const maxWidthMap = {
  full: "100%",
  "7xl": "80rem",
  "6xl": "72rem",
  "5xl": "64rem",
  "4xl": "56rem",
  "3xl": "48rem",
  "2xl": "42rem",
  xl: "36rem",
};

export function Section({
  children,
  backgroundColor = "transparent",
  backgroundImage,
  paddingTop = 48,
  paddingBottom = 48,
  paddingLeft = 24,
  paddingRight = 24,
  maxWidth = "7xl",
  minHeight = 0,
  className = "",
}: SectionProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <section
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        minHeight: minHeight ? `${minHeight}px` : undefined,
      }}
      className={className}
    >
      <div
        style={{
          maxWidth: maxWidthMap[maxWidth],
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: `${paddingLeft}px`,
          paddingRight: `${paddingRight}px`,
        }}
      >
        {children || (
          <Element id="section-content" is={Container} canvas>
            <Text text="Add content here..." />
          </Element>
        )}
      </div>
    </section>
  );
}

Section.craft = {
  displayName: "Section",
  props: {
    backgroundColor: "transparent",
    backgroundImage: "",
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 24,
    paddingRight: 24,
    maxWidth: "7xl",
    minHeight: 0,
  },
  related: {
    settings: SectionSettings,
  },
  rules: {
    canMoveIn: () => true,
  },
};
