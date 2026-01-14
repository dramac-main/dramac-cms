"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import { SettingsInput } from "./settings-input";
import type { TextProps } from "../user-components/text";

const tagOptions = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "span", label: "Span" },
];

const fontSizeOptions = [
  { value: "text-xs", label: "Extra Small" },
  { value: "text-sm", label: "Small" },
  { value: "text-base", label: "Base" },
  { value: "text-lg", label: "Large" },
  { value: "text-xl", label: "X-Large" },
  { value: "text-2xl", label: "2X-Large" },
  { value: "text-3xl", label: "3X-Large" },
  { value: "text-4xl", label: "4X-Large" },
  { value: "text-5xl", label: "5X-Large" },
];

const fontWeightOptions = [
  { value: "font-thin", label: "Thin" },
  { value: "font-light", label: "Light" },
  { value: "font-normal", label: "Normal" },
  { value: "font-medium", label: "Medium" },
  { value: "font-semibold", label: "Semibold" },
  { value: "font-bold", label: "Bold" },
  { value: "font-extrabold", label: "Extra Bold" },
];

const textAlignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function TextSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TextProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <div className="space-y-2">
          <Label className="text-xs">Text</Label>
          <Textarea
            value={props.text || ""}
            onChange={(e) =>
              setProp((props: TextProps) => (props.text = e.target.value))
            }
            placeholder="Enter text..."
            className="min-h-[80px]"
          />
        </div>

        <SettingsSelect
          label="HTML Tag"
          value={props.tag || "p"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.tag = value as TextProps["tag"]))
          }
          options={tagOptions}
        />
      </div>

      <Separator />

      {/* Typography */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Typography</h4>

        <SettingsSelect
          label="Font Size"
          value={props.fontSize || "text-base"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.fontSize = value))
          }
          options={fontSizeOptions}
        />

        <SettingsSelect
          label="Font Weight"
          value={props.fontWeight || "font-normal"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.fontWeight = value))
          }
          options={fontWeightOptions}
        />

        <SettingsSelect
          label="Text Align"
          value={props.textAlign || "left"}
          onChange={(value) =>
            setProp((props: TextProps) => (props.textAlign = value as "left" | "center" | "right"))
          }
          options={textAlignOptions}
        />

        <SettingsColor
          label="Text Color"
          value={props.color || ""}
          onChange={(value) =>
            setProp((props: TextProps) => (props.color = value))
          }
        />
      </div>

      <Separator />

      {/* Custom */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom</h4>

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: TextProps) => (props.className = value))
          }
          placeholder="e.g., italic underline"
        />
      </div>
    </div>
  );
}
