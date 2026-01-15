"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function FormSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Submit Button Text */}
      <div className="space-y-2">
        <Label>Submit Button Text</Label>
        <Input
          value={props.submitText as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.submitText = e.target.value))}
        />
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <Label>Success Message</Label>
        <Input
          value={props.successMessage as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.successMessage = e.target.value))}
        />
      </div>

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
    </div>
  );
}
