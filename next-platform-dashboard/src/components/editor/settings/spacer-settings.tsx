"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export function SpacerSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Height */}
      <div className="space-y-2">
        <Label>Height: {props.height}px</Label>
        <Slider
          value={[props.height as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.height = value))}
          min={8}
          max={200}
          step={4}
        />
      </div>

      {/* Exact Height Input */}
      <div className="space-y-2">
        <Label>Exact Height (px)</Label>
        <Input
          type="number"
          value={props.height as number}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.height = parseInt(e.target.value) || 32))}
          min={0}
        />
      </div>
    </div>
  );
}
