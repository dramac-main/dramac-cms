"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { ButtonComponentProps } from "../user-components/button-component";

const variantOptions = [
  { value: "default", label: "Default" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
];

const sizeOptions = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const borderRadiusOptions = [
  { value: "rounded-none", label: "None" },
  { value: "rounded-sm", label: "Small" },
  { value: "rounded-md", label: "Medium" },
  { value: "rounded-lg", label: "Large" },
  { value: "rounded-full", label: "Full" },
];

export function ButtonSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ButtonComponentProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <SettingsInput
          label="Button Text"
          value={props.text || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.text = value))
          }
          placeholder="Click Me"
        />

        <SettingsInput
          label="Link URL"
          value={props.href || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.href = value))
          }
          placeholder="https://example.com"
          type="url"
        />
      </div>

      <Separator />

      {/* Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Style</h4>

        <SettingsSelect
          label="Variant"
          value={props.variant || "default"}
          onChange={(value) =>
            setProp(
              (props: ButtonComponentProps) =>
                (props.variant = value as ButtonComponentProps["variant"])
            )
          }
          options={variantOptions}
        />

        <SettingsSelect
          label="Size"
          value={props.size || "md"}
          onChange={(value) =>
            setProp(
              (props: ButtonComponentProps) =>
                (props.size = value as ButtonComponentProps["size"])
            )
          }
          options={sizeOptions}
        />

        <SettingsSelect
          label="Border Radius"
          value={props.borderRadius || "rounded-md"}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.borderRadius = value))
          }
          options={borderRadiusOptions}
        />
      </div>

      <Separator />

      {/* Custom Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Custom Colors</h4>
        <p className="text-xs text-muted-foreground">
          Override variant colors
        </p>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: ButtonComponentProps) => (props.textColor = value))
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
            setProp((props: ButtonComponentProps) => (props.className = value))
          }
          placeholder="e.g., shadow-lg"
        />
      </div>
    </div>
  );
}
