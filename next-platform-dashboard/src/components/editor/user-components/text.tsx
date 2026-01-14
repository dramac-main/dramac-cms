"use client";

import { useNode, useEditor } from "@craftjs/core";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TextProps {
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  className?: string;
  tag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
}

export function Text({
  text = "Click to edit text",
  fontSize = "text-base",
  fontWeight = "font-normal",
  color = "",
  textAlign = "left",
  className = "",
  tag = "p",
}: TextProps) {
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Use a separate effect with proper dependency to avoid setState in effect body
  const wasSelected = useRef(selected);
  
  useEffect(() => {
    if (wasSelected.current && !selected) {
      setIsEditing(false);
    }
    wasSelected.current = selected;
  }, [selected]);

  const handleDoubleClick = () => {
    if (enabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      setProp((props: TextProps) => {
        props.text = textRef.current?.innerText || "";
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      textRef.current?.blur();
    }
  };

  const Tag = tag;

  return (
    <Tag
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={cn(fontSize, fontWeight, className, {
        "outline-2 outline-primary outline-dashed": isEditing,
        "cursor-text": enabled,
      })}
      style={{ color, textAlign }}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <span ref={textRef}>{text}</span>
    </Tag>
  );
}

Text.craft = {
  displayName: "Text",
  props: {
    text: "Click to edit text",
    fontSize: "text-base",
    fontWeight: "font-normal",
    color: "",
    textAlign: "left",
    className: "",
    tag: "p",
  },
  related: {
    toolbar: () => import("../settings/text-settings").then((m) => m.TextSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
