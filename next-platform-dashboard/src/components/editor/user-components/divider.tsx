"use client";

import { useNode } from "@craftjs/core";
import { DividerSettings } from "../settings/divider-settings";

interface DividerProps {
  color?: string;
  thickness?: number;
  style?: "solid" | "dashed" | "dotted";
  marginTop?: number;
  marginBottom?: number;
}

export function Divider({
  color = "#e5e7eb",
  thickness = 1,
  style = "solid",
  marginTop = 16,
  marginBottom = 16,
}: DividerProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <hr
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        borderColor: color,
        borderWidth: `${thickness}px 0 0 0`,
        borderStyle: style,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        width: "100%",
      }}
    />
  );
}

Divider.craft = {
  displayName: "Divider",
  props: {
    color: "#e5e7eb",
    thickness: 1,
    style: "solid",
    marginTop: 16,
    marginBottom: 16,
  },
  related: {
    settings: DividerSettings,
  },
};
