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

export function DividerSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.color as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.color = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.color as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.color = e.target.value))}
          />
        </div>
      </div>

      {/* Thickness */}
      <div className="space-y-2">
        <Label>Thickness: {props.thickness}px</Label>
        <Slider
          value={[props.thickness as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.thickness = value))}
          min={1}
          max={10}
          step={1}
        />
      </div>

      {/* Style */}
      <div className="space-y-2">
        <Label>Style</Label>
        <Select
          value={props.style as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.style = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Margins */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Margin Top</Label>
          <Input
            type="number"
            value={props.marginTop as number}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.marginTop = parseInt(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-2">
          <Label>Margin Bottom</Label>
          <Input
            type="number"
            value={props.marginBottom as number}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.marginBottom = parseInt(e.target.value) || 0))}
          />
        </div>
      </div>
    </div>
  );
}
