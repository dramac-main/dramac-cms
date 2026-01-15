"use client";

import { useNode } from "@craftjs/core";
import { SpacerSettings } from "../settings/spacer-settings";

interface SpacerProps {
  height?: number;
}

export function Spacer({ height = 32 }: SpacerProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        height: `${height}px`,
        width: "100%",
      }}
      className="bg-muted/20 hover:bg-muted/40 transition-colors relative group"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
          {height}px
        </span>
      </div>
    </div>
  );
}

Spacer.craft = {
  displayName: "Spacer",
  props: {
    height: 32,
  },
  related: {
    settings: SpacerSettings,
  },
};
