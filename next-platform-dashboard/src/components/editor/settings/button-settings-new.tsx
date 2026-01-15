"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ButtonSettingsNew() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Text */}
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={props.text as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.text = e.target.value))}
        />
      </div>

      {/* Link */}
      <div className="space-y-2">
        <Label>Link URL</Label>
        <Input
          value={props.href as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.href = e.target.value))}
          placeholder="#"
        />
      </div>

      {/* Variant */}
      <div className="space-y-2">
        <Label>Variant</Label>
        <Select
          value={props.variant as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.variant = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="ghost">Ghost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label>Size</Label>
        <Select
          value={props.size as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.size = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Background Color */}
      <div className="space-y-2">
        <Label>Custom Background (optional)</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.backgroundColor as string || "#6366f1"}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.backgroundColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
            placeholder="Leave empty for default"
          />
        </div>
      </div>

      {/* Custom Text Color */}
      <div className="space-y-2">
        <Label>Custom Text Color (optional)</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.textColor as string || "#ffffff"}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.textColor = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.textColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.textColor = e.target.value))}
            placeholder="Leave empty for default"
          />
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius: {props.borderRadius}px</Label>
        <Slider
          value={[props.borderRadius as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.borderRadius = value))}
          min={0}
          max={24}
          step={2}
        />
      </div>

      {/* Full Width */}
      <div className="flex items-center justify-between">
        <Label>Full Width</Label>
        <Switch
          checked={props.fullWidth as boolean}
          onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.fullWidth = checked))}
        />
      </div>
    </div>
  );
}
