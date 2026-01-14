"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { ContainerProps } from "../user-components/container";

const paddingOptions = [
  { value: "p-0", label: "None" },
  { value: "p-2", label: "Small (8px)" },
  { value: "p-4", label: "Medium (16px)" },
  { value: "p-6", label: "Large (24px)" },
  { value: "p-8", label: "X-Large (32px)" },
  { value: "p-12", label: "2X-Large (48px)" },
];

const gapOptions = [
  { value: "gap-0", label: "None" },
  { value: "gap-2", label: "Small (8px)" },
  { value: "gap-4", label: "Medium (16px)" },
  { value: "gap-6", label: "Large (24px)" },
  { value: "gap-8", label: "X-Large (32px)" },
];

const flexDirectionOptions = [
  { value: "column", label: "Vertical" },
  { value: "row", label: "Horizontal" },
];

const justifyOptions = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
  { value: "space-around", label: "Space Around" },
];

const alignOptions = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
];

export function ContainerSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ContainerProps,
  }));

  return (
    <div className="space-y-6">
      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Direction"
          value={props.flexDirection || "column"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.flexDirection = value as "row" | "column"))
          }
          options={flexDirectionOptions}
        />

        <SettingsSelect
          label="Justify Content"
          value={props.justifyContent || "flex-start"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.justifyContent = value))
          }
          options={justifyOptions}
        />

        <SettingsSelect
          label="Align Items"
          value={props.alignItems || "stretch"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.alignItems = value))
          }
          options={alignOptions}
        />

        <SettingsSelect
          label="Gap"
          value={props.gap || "gap-4"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.gap = value))
          }
          options={gapOptions}
        />
      </div>

      <Separator />

      {/* Spacing */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Spacing</h4>

        <SettingsSelect
          label="Padding"
          value={props.padding || "p-4"}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.padding = value))
          }
          options={paddingOptions}
        />

        <SettingsInput
          label="Min Height"
          value={props.minHeight || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.minHeight = value))
          }
          placeholder="e.g., min-h-[400px]"
        />
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Appearance</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.backgroundColor = value))
          }
        />

        <SettingsInput
          label="Custom Classes"
          value={props.className || ""}
          onChange={(value) =>
            setProp((props: ContainerProps) => (props.className = value))
          }
          placeholder="e.g., rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
