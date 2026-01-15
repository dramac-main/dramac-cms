"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export function HeadingSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div className="space-y-2">
        <Label>Heading Text</Label>
        <Input
          value={props.text as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.text = e.target.value))}
        />
      </div>

      {/* Heading Level */}
      <div className="space-y-2">
        <Label>Heading Level</Label>
        <Select
          value={props.level as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.level = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1 - Main Title</SelectItem>
            <SelectItem value="h2">H2 - Section Title</SelectItem>
            <SelectItem value="h3">H3 - Subsection</SelectItem>
            <SelectItem value="h4">H4 - Minor Section</SelectItem>
            <SelectItem value="h5">H5 - Small Heading</SelectItem>
            <SelectItem value="h6">H6 - Smallest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <Label>Font Size: {props.fontSize || "auto"}px</Label>
        <Slider
          value={[props.fontSize as number || 24]}
          onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.fontSize = value))}
          min={12}
          max={96}
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
            <SelectItem value="extrabold">Extra Bold</SelectItem>
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
          onValueChange={(value: string) => value && setProp((props: Record<string, unknown>) => (props.textAlign = value))}
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
