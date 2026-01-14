"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import type { ImageComponentProps } from "../user-components/image-component";

const objectFitOptions = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
  { value: "none", label: "None" },
];

const borderRadiusOptions = [
  { value: "rounded-none", label: "None" },
  { value: "rounded-sm", label: "Small" },
  { value: "rounded-md", label: "Medium" },
  { value: "rounded-lg", label: "Large" },
  { value: "rounded-xl", label: "X-Large" },
  { value: "rounded-2xl", label: "2X-Large" },
  { value: "rounded-full", label: "Full" },
];

export function ImageSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ImageComponentProps,
  }));

  return (
    <div className="space-y-6">
      {/* Source */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Image Source</h4>

        <SettingsInput
          label="Image URL"
          value={props.src || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.src = value))
          }
          placeholder="https://example.com/image.jpg"
          type="url"
        />

        <SettingsInput
          label="Alt Text"
          value={props.alt || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.alt = value))
          }
          placeholder="Describe the image"
        />
      </div>

      <Separator />

      {/* Dimensions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Dimensions</h4>

        <SettingsInput
          label="Width"
          value={props.width || "100%"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.width = value))
          }
          placeholder="100% or 300px"
        />

        <SettingsInput
          label="Height"
          value={props.height || "auto"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.height = value))
          }
          placeholder="auto or 200px"
        />

        <SettingsSelect
          label="Object Fit"
          value={props.objectFit || "cover"}
          onChange={(value) =>
            setProp(
              (props: ImageComponentProps) =>
                (props.objectFit = value as ImageComponentProps["objectFit"])
            )
          }
          options={objectFitOptions}
        />
      </div>

      <Separator />

      {/* Style */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Style</h4>

        <SettingsSelect
          label="Border Radius"
          value={props.borderRadius || "rounded-none"}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.borderRadius = value))
          }
          options={borderRadiusOptions}
        />

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: ImageComponentProps) => (props.className = value))
          }
          placeholder="e.g., shadow-lg"
        />
      </div>
    </div>
  );
}
