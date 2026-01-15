"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ColumnsSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Number of Columns */}
      <div className="space-y-2">
        <Label>Number of Columns</Label>
        <Select
          value={String(props.columns)}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.columns = parseInt(value)))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gap */}
      <div className="space-y-2">
        <Label>Gap: {props.gap}px</Label>
        <Slider
          value={[props.gap as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.gap = value))}
          min={0}
          max={64}
          step={4}
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
    </div>
  );
}
