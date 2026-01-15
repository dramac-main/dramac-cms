"use client";

import { useNode, Element } from "@craftjs/core";
import { ReactNode } from "react";
import { Container } from "./container";
import { CardSettings } from "../settings/card-settings";

interface CardProps {
  children?: ReactNode;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  borderWidth?: number;
  borderColor?: string;
}

const shadowMap = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

export function Card({
  children,
  backgroundColor = "#ffffff",
  borderRadius = 8,
  padding = 24,
  shadow = "md",
  borderWidth = 1,
  borderColor = "#e5e7eb",
}: CardProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        boxShadow: shadowMap[shadow],
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderColor,
      }}
    >
      {children || (
        <Element id="card-content" is={Container} canvas padding="p-0">
          <div className="text-muted-foreground text-sm text-center p-4 border-2 border-dashed border-muted-foreground/30 rounded">
            Drop content here
          </div>
        </Element>
      )}
    </div>
  );
}

Card.craft = {
  displayName: "Card",
  props: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 24,
    shadow: "md",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  related: {
    settings: CardSettings,
  },
  rules: {
    canMoveIn: () => true,
  },
};
