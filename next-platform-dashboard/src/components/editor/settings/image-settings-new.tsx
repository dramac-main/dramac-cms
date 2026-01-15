"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ImageSettingsNew() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Source URL */}
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={props.src as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.src = e.target.value))}
          placeholder="https://..."
        />
      </div>

      {/* Alt Text */}
      <div className="space-y-2">
        <Label>Alt Text</Label>
        <Input
          value={props.alt as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.alt = e.target.value))}
          placeholder="Image description"
        />
      </div>

      {/* Width */}
      <div className="space-y-2">
        <Label>Width</Label>
        <Input
          value={props.width as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.width = e.target.value))}
          placeholder="100%, 300px, etc."
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label>Height</Label>
        <Input
          value={props.height as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.height = e.target.value))}
          placeholder="auto, 200px, etc."
        />
      </div>

      {/* Object Fit */}
      <div className="space-y-2">
        <Label>Object Fit</Label>
        <Select
          value={props.objectFit as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.objectFit = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius: {props.borderRadius}px</Label>
        <Slider
          value={[props.borderRadius as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.borderRadius = value))}
          min={0}
          max={100}
          step={2}
        />
      </div>
    </div>
  );
}
