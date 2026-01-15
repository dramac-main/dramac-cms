"use client";

import { useNode } from "@craftjs/core";
import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ColumnProps {
  children?: ReactNode;
  backgroundColor?: string;
  padding?: number;
  verticalAlign?: "top" | "center" | "bottom";
}

export function Column({
  children,
  backgroundColor = "transparent",
  padding = 16,
  verticalAlign = "top",
}: ColumnProps) {
  const { connectors: { connect, drag } } = useNode();

  const alignmentMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: alignmentMap[verticalAlign],
        minHeight: "100px",
      }}
    >
      {children || (
        <div className="text-muted-foreground text-sm text-center p-4 border-2 border-dashed border-muted-foreground/30 rounded">
          Drop content here
        </div>
      )}
    </div>
  );
}

function ColumnSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props as ColumnProps,
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Background Color</Label>
        <Input
          type="color"
          value={props.backgroundColor === "transparent" ? "#ffffff" : props.backgroundColor}
          onChange={(e) => setProp((props: ColumnProps) => (props.backgroundColor = e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Padding (px)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={props.padding}
          onChange={(e) => setProp((props: ColumnProps) => (props.padding = parseInt(e.target.value) || 0))}
        />
      </div>

      <div className="space-y-2">
        <Label>Vertical Alignment</Label>
        <Select
          value={props.verticalAlign}
          onValueChange={(value) => setProp((props: ColumnProps) => (props.verticalAlign = value as "top" | "center" | "bottom"))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

Column.craft = {
  displayName: "Column",
  props: {
    backgroundColor: "transparent",
    padding: 16,
    verticalAlign: "top",
  },
  rules: {
    canMoveIn: () => true,
  },
  related: {
    settings: ColumnSettings,
  },
};
