"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VideoSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      {/* URL */}
      <div className="space-y-2">
        <Label>Video URL</Label>
        <Input
          value={props.url as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.url = e.target.value))}
          placeholder="https://youtube.com/watch?v=..."
        />
        <p className="text-xs text-muted-foreground">
          Supports YouTube, Vimeo, or direct video links
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={props.title as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.title = e.target.value))}
        />
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <Select
          value={props.aspectRatio as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.aspectRatio = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Autoplay</Label>
          <Switch
            checked={props.autoplay as boolean}
            onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.autoplay = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Muted</Label>
          <Switch
            checked={props.muted as boolean}
            onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.muted = checked))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Show Controls</Label>
          <Switch
            checked={props.controls as boolean}
            onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.controls = checked))}
          />
        </div>
      </div>
    </div>
  );
}
