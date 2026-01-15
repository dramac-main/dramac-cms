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

export function MapSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={props.address as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.address = e.target.value))}
          placeholder="123 Main St, City, Country"
        />
      </div>

      {/* Zoom */}
      <div className="space-y-2">
        <Label>Zoom Level: {props.zoom}</Label>
        <Slider
          value={[props.zoom as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.zoom = value))}
          min={1}
          max={20}
          step={1}
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label>Height: {props.height}px</Label>
        <Slider
          value={[props.height as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.height = value))}
          min={200}
          max={800}
          step={10}
        />
      </div>

      {/* Style */}
      <div className="space-y-2">
        <Label>Map Style</Label>
        <Select
          value={props.style as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.style = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roadmap">Roadmap</SelectItem>
            <SelectItem value="satellite">Satellite</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
