"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export function TextSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div className="space-y-2">
        <Label>Text Content</Label>
        <Textarea
          value={props.text as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.text = e.target.value))}
          rows={3}
        />
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Font Size: {props.fontSize}px</Label>
        <Slider
          value={[props.fontSize as number]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.fontSize = value))}
          min={10}
          max={72}
          step={1}
        />
      </div>

      {/* Font Weight */}
      <div className="space-y-2">
        <Label>Font Weight</Label>
        <Select
          value={props.fontWeight as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.fontWeight = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="semibold">Semibold</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Text Color */}
      <div className="space-y-2">
        <Label>Text Color</Label>
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

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          value={props.textAlign as string}
          onValueChange={(value) => value && setProp((props: Record<string, unknown>) => (props.textAlign = value))}
          className="justify-start"
        >
          <ToggleGroupItem value="left" aria-label="Left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <Label>Line Height: {props.lineHeight}</Label>
        <Slider
          value={[(props.lineHeight as number) * 10]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.lineHeight = value / 10))}
          min={10}
          max={30}
          step={1}
        />
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
