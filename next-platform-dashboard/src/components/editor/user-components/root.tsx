"use client";

import { useNode } from "@craftjs/core";
import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RootProps {
  children?: ReactNode;
  backgroundColor?: string;
  padding?: number;
}

export function Root({ children, backgroundColor = "#ffffff", padding = 0 }: RootProps) {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

function RootSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props as RootProps,
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Page Background Color</Label>
        <Input
          type="color"
          value={props.backgroundColor || "#ffffff"}
          onChange={(e) => setProp((props: RootProps) => (props.backgroundColor = e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Page Padding (px)</Label>
        <Input
          type="number"
          min={0}
          max={200}
          value={props.padding}
          onChange={(e) => setProp((props: RootProps) => (props.padding = parseInt(e.target.value) || 0))}
        />
      </div>
    </div>
  );
}

Root.craft = {
  displayName: "Page",
  props: {
    backgroundColor: "#ffffff",
    padding: 0,
  },
  rules: {
    canDrag: () => false,
  },
  related: {
    settings: RootSettings,
  },
};
