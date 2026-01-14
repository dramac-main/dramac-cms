"use client";

import { Frame, Element } from "@craftjs/core";
import { Container } from "./user-components/container";
import { cn } from "@/lib/utils";
import type { CanvasSettings, CANVAS_WIDTHS } from "@/types/editor";

interface EditorCanvasProps {
  settings: CanvasSettings;
}

const widthClasses = {
  mobile: "max-w-[375px]",
  tablet: "max-w-[768px]",
  desktop: "max-w-[1280px]",
  full: "max-w-full",
};

export function EditorCanvas({ settings }: EditorCanvasProps) {
  return (
    <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8">
      <div
        className={cn(
          "mx-auto min-h-[600px] bg-background shadow-lg transition-all duration-300",
          widthClasses[settings.width],
          settings.showOutlines && "**:outline-1 **:outline-border/50"
        )}
      >
        <Frame>
          <Element
            is={Container}
            canvas
            className="min-h-[600px] w-full"
            padding="p-0"
          >
            {/* Initial empty canvas */}
          </Element>
        </Frame>
      </div>
    </div>
  );
}
