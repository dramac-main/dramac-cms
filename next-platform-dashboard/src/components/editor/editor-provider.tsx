"use client";

import { Editor } from "@craftjs/core";
import { componentResolver } from "./resolver";
import type { ReactNode } from "react";

interface EditorProviderProps {
  children: ReactNode;
  enabled?: boolean;
  onNodesChange?: (query: any) => void;
}

export function EditorProvider({
  children,
  enabled = true,
  onNodesChange,
}: EditorProviderProps) {
  return (
    <Editor
      resolver={componentResolver}
      enabled={enabled}
      onNodesChange={(query) => {
        onNodesChange?.(query);
      }}
    >
      {children}
    </Editor>
  );
}
