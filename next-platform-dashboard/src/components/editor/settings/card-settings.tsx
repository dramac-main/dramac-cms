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

export function CardSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Background Color */}
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.backgroundColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.backgroundColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
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
          max={32}
          step={1}
        />
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <Label>Padding: {props.padding}px</Label>
        <Slider
          value={[props.padding as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.padding = value))}
          min={0}
          max={64}
          step={4}
        />
      </div>

      {/* Shadow */}
      <div className="space-y-2">
        <Label>Shadow</Label>
        <Select
          value={props.shadow as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.shadow = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Border Width */}
      <div className="space-y-2">
        <Label>Border Width: {props.borderWidth}px</Label>
        <Slider
          value={[props.borderWidth as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.borderWidth = value))}
          min={0}
          max={5}
          step={1}
        />
      </div>

      {/* Border Color */}
      <div className="space-y-2">
        <Label>Border Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={props.borderColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.borderColor = e.target.value))}
            className="w-12 h-10 p-1"
          />
          <Input
            value={props.borderColor as string}
            onChange={(e) => setProp((props: Record<string, unknown>) => (props.borderColor = e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
