"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ContactFormProps } from "../user-components/contact-form";

export function ContactFormSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as ContactFormProps,
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
            onChange={(e) => setProp((p: ContactFormProps) => (p.title = e.target.value))}
            placeholder="Form title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={props.subtitle || ""}
            onChange={(e) => setProp((p: ContactFormProps) => (p.subtitle = e.target.value))}
            placeholder="Form subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buttonText">Button Text</Label>
          <Input
            id="buttonText"
            value={props.buttonText || ""}
            onChange={(e) => setProp((p: ContactFormProps) => (p.buttonText = e.target.value))}
            placeholder="Submit button text"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Form Fields
        </h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="showName">Show Name Fields</Label>
          <Switch
            id="showName"
            checked={props.showName ?? true}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showName = checked))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showPhone">Show Phone Field</Label>
          <Switch
            id="showPhone"
            checked={props.showPhone ?? false}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showPhone = checked))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showSubject">Show Subject Field</Label>
          <Switch
            id="showSubject"
            checked={props.showSubject ?? true}
            onCheckedChange={(checked) =>
              setProp((p: ContactFormProps) => (p.showSubject = checked))
            }
          />
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
                setProp((p: ContactFormProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.backgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formBackgroundColor">Form Background</Label>
          <div className="flex gap-2">
            <Input
              id="formBackgroundColor"
              value={props.formBackgroundColor || ""}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.formBackgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.formBackgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: ContactFormProps) => (p.formBackgroundColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
