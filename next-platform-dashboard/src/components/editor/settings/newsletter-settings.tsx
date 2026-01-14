"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NewsletterProps } from "../user-components/newsletter";

export function NewsletterSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as NewsletterProps,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Content
        </h4>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={props.title || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.title = e.target.value))}
            placeholder="Newsletter title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={props.subtitle || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.subtitle = e.target.value))}
            placeholder="Newsletter subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholder">Input Placeholder</Label>
          <Input
            id="placeholder"
            value={props.placeholder || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.placeholder = e.target.value))}
            placeholder="Email placeholder text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buttonText">Button Text</Label>
          <Input
            id="buttonText"
            value={props.buttonText || ""}
            onChange={(e) => setProp((p: NewsletterProps) => (p.buttonText = e.target.value))}
            placeholder="Subscribe"
          />
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Layout
        </h4>

        <div className="space-y-2">
          <Label>Form Layout</Label>
          <Select
            value={props.layout || "inline"}
            onValueChange={(value: "inline" | "stacked") =>
              setProp((p: NewsletterProps) => (p.layout = value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="stacked">Stacked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Style */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Style
        </h4>

        <div className="space-y-2">
          <Label htmlFor="backgroundColor">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="backgroundColor"
              value={props.backgroundColor || ""}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#1a1a2e"
            />
            <input
              type="color"
              value={props.backgroundColor || "#1a1a2e"}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              value={props.textColor || ""}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.textColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: NewsletterProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
