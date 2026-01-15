"use client";

import { useNode, useEditor } from "@craftjs/core";
import { useState, useRef, useCallback } from "react";
import ContentEditable from "react-contenteditable";
import { TextSettings } from "../settings/text-settings";

interface TextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  marginTop?: number;
  marginBottom?: number;
}

const fontWeightMap = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export function Text({
  text = "Edit this text...",
  fontSize = 16,
  fontWeight = "normal",
  color = "#1f2937",
  textAlign = "left",
  lineHeight = 1.5,
  marginTop = 0,
  marginBottom = 0,
}: TextProps) {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [editable, setEditable] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  const handleRef = useCallback((ref: HTMLDivElement | null) => {
    if (ref) {
      connect(drag(ref));
    }
  }, [connect, drag]);

  return (
    <div
      ref={handleRef}
      onClick={() => enabled && setEditable(true)}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: fontWeightMap[fontWeight],
        color,
        textAlign,
        lineHeight,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        cursor: enabled ? "text" : "default",
        minHeight: "1em",
      }}
    >
      <ContentEditable
        innerRef={contentRef as React.RefObject<HTMLElement>}
        html={text}
        disabled={!editable}
        onChange={(e) => {
          setProp((props: Record<string, unknown>) => (props.text = e.target.value));
        }}
        onBlur={() => setEditable(false)}
        tagName="p"
        style={{ outline: "none", margin: 0 }}
      />
    </div>
  );
}

Text.craft = {
  displayName: "Text",
  props: {
    text: "Edit this text...",
    fontSize: 16,
    fontWeight: "normal",
    color: "#1f2937",
    textAlign: "left",
    lineHeight: 1.5,
    marginTop: 0,
    marginBottom: 0,
  },
  related: {
    settings: TextSettings,
  },
};
