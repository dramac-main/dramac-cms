/**
 * NoteNode — Sticky note for documentation.
 * Light yellow background. No handles. Resizable.
 */

"use client";

import { memo, useCallback } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { StickyNote } from "lucide-react";

type NoteNodeData = {
  label: string;
  text?: string;
  onTextChange?: (text: string) => void;
};

type NoteNodeType = Node<NoteNodeData, "note">;

function NoteNodeComponent({ data, selected }: NodeProps<NoteNodeType>) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      data.onTextChange?.(e.target.value);
    },
    [data],
  );

  return (
    <div
      className={`
        min-w-[180px] max-w-[300px] rounded-md border bg-yellow-50 p-3 shadow-sm dark:bg-yellow-950/30
        ${selected ? "border-yellow-400 ring-2 ring-yellow-400/30" : "border-yellow-300/60 dark:border-yellow-800/40"}
      `}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <StickyNote className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
          Note
        </span>
      </div>
      <textarea
        value={data.text || data.label || ""}
        onChange={handleChange}
        className="w-full resize-none bg-transparent text-xs text-yellow-900 placeholder:text-yellow-600/50 focus:outline-none dark:text-yellow-200 dark:placeholder:text-yellow-700"
        rows={3}
        placeholder="Add a note..."
      />
    </div>
  );
}

export const NoteNode = memo(NoteNodeComponent);
