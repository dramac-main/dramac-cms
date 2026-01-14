"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { CTASectionProps } from "../user-components/cta-section";

const layoutOptions = [
  { value: "centered", label: "Centered" },
  { value: "split", label: "Split (Side by Side)" },
];

export function CTASettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CTASectionProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Content</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.title = value))
          }
          placeholder="Headline"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.subtitle = value))
          }
          placeholder="Supporting text"
        />
      </div>

      <Separator />

      {/* Primary Button */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Primary Button</h4>

        <SettingsInput
          label="Button Text"
          value={props.primaryButtonText || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.primaryButtonText = value))
          }
          placeholder="Call to action"
        />

        <SettingsInput
          label="Button Link"
          value={props.primaryButtonHref || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.primaryButtonHref = value))
          }
          placeholder="https://..."
          type="url"
        />
      </div>

      <Separator />

      {/* Secondary Button */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Secondary Button</h4>

        <SettingsInput
          label="Button Text"
          value={props.secondaryButtonText || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.secondaryButtonText = value))
          }
          placeholder="Leave empty to hide"
        />

        <SettingsInput
          label="Button Link"
          value={props.secondaryButtonHref || ""}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.secondaryButtonHref = value))
          }
          placeholder="https://..."
          type="url"
        />
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Layout Style"
          value={props.layout || "centered"}
          onChange={(value) =>
            setProp(
              (props: CTASectionProps) =>
                (props.layout = value as CTASectionProps["layout"])
            )
          }
          options={layoutOptions}
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#4f46e5"}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || "#ffffff"}
          onChange={(value) =>
            setProp((props: CTASectionProps) => (props.textColor = value))
          }
        />
      </div>
    </div>
  );
}
