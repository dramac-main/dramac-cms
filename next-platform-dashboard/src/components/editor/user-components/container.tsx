"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface ContainerProps {
  children?: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  minHeight?: string;
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
}

export function Container({
  children,
  className = "",
  backgroundColor = "",
  padding = "p-4",
  margin = "",
  minHeight = "",
  flexDirection = "column",
  justifyContent = "flex-start",
  alignItems = "stretch",
  gap = "gap-4",
}: ContainerProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={cn(
        "flex",
        padding,
        margin,
        gap,
        minHeight,
        className
      )}
      style={{
        backgroundColor,
        flexDirection,
        justifyContent,
        alignItems,
      }}
    >
      {children}
    </div>
  );
}

Container.craft = {
  displayName: "Container",
  props: {
    className: "",
    backgroundColor: "",
    padding: "p-4",
    margin: "",
    minHeight: "",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    gap: "gap-4",
  },
  related: {
    toolbar: () => import("../settings/container-settings").then((m) => m.ContainerSettings),
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};
