"use client";

import { Frame, Element, useEditor } from "@craftjs/core";
import { Root } from "./user-components/root";
import { cn } from "@/lib/utils";
import type { CanvasSettings } from "@/types/editor";

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
  const { connectors } = useEditor();

  return (
    <div
      className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8"
      ref={(ref) => {
        if (ref) {
          connectors.select(connectors.hover(ref, ""), "");
        }
      }}
    >
      <div
        className={cn(
          "mx-auto min-h-150 bg-background shadow-lg transition-all duration-300",
          widthClasses[settings.width],
          settings.showOutlines && "editor-outlines"
        )}
      >
        <Frame>
          <Element
            is={Root}
            canvas
          >
            {/* Content will be loaded via deserialize */}
          </Element>
        </Frame>
      </div>

      {/* CSS for outline mode */}
      <style jsx global>{`
        .editor-outlines [data-cy="craftjs-renderer"] > * {
          outline: 1px dashed hsl(var(--border));
          outline-offset: -1px;
        }
        .editor-outlines [data-cy="craftjs-renderer"] > *:hover {
          outline-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
