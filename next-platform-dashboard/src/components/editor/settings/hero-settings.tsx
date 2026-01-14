"use client";

import { useNode } from "@craftjs/core";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import type { HeroSectionProps } from "../user-components/hero-section";

const alignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const heightOptions = [
  { value: "min-h-[400px]", label: "Small (400px)" },
  { value: "min-h-[500px]", label: "Medium (500px)" },
  { value: "min-h-[600px]", label: "Large (600px)" },
  { value: "min-h-screen", label: "Full Screen" },
];

export function HeroSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as HeroSectionProps,
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
            setProp((props: HeroSectionProps) => (props.title = value))
          }
          placeholder="Main headline"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.subtitle = value))
          }
          placeholder="Supporting text"
        />

        <SettingsInput
          label="Button Text"
          value={props.buttonText || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.buttonText = value))
          }
          placeholder="Call to action"
        />

        <SettingsInput
          label="Button Link"
          value={props.buttonHref || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.buttonHref = value))
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
          label="Alignment"
          value={props.alignment || "center"}
          onChange={(value) =>
            setProp(
              (props: HeroSectionProps) =>
                (props.alignment = value as HeroSectionProps["alignment"])
            )
          }
          options={alignmentOptions}
        />

        <SettingsSelect
          label="Height"
          value={props.height || "min-h-[500px]"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.height = value))
          }
          options={heightOptions}
        />
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Background</h4>

        <SettingsInput
          label="Background Image URL"
          value={props.backgroundImage || ""}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.backgroundImage = value))
          }
          placeholder="https://..."
          type="url"
        />

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || "#1a1a2e"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || "#ffffff"}
          onChange={(value) =>
            setProp((props: HeroSectionProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Overlay */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Overlay</h4>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Enable Overlay</Label>
          <Switch
            checked={props.overlay ?? true}
            onCheckedChange={(checked) =>
              setProp((props: HeroSectionProps) => (props.overlay = checked))
            }
          />
        </div>

        {props.overlay && (
          <div className="space-y-2">
            <Label className="text-xs">
              Overlay Opacity: {props.overlayOpacity || 50}%
            </Label>
            <Slider
              value={[props.overlayOpacity || 50]}
              onValueChange={(values: number[]) =>
                setProp((props: HeroSectionProps) => (props.overlayOpacity = values[0]))
              }
              min={0}
              max={100}
              step={5}
            />
          </div>
        )}
      </div>
    </div>
  );
}
