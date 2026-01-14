import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderContainerProps {
  background?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  flexDirection?: "row" | "column";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "between" | "around";
  gap?: number;
  width?: string;
  minHeight?: string;
  className?: string;
  children?: ReactNode;
}

export function RenderContainer({
  background = "transparent",
  padding = 0,
  margin = 0,
  borderRadius = 0,
  flexDirection = "column",
  alignItems = "stretch",
  justifyContent = "start",
  gap = 0,
  width = "100%",
  minHeight,
  className,
  children,
}: RenderContainerProps) {
  const justifyMap = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };

  const alignMap = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={cn(
        "flex",
        flexDirection === "row" ? "flex-row" : "flex-col",
        justifyMap[justifyContent],
        alignMap[alignItems],
        className
      )}
      style={{
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        borderRadius: `${borderRadius}px`,
        gap: `${gap}px`,
        width,
        minHeight,
      }}
    >
      {children}
    </div>
  );
}
