"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import type { NavigationProps, NavLink } from "../user-components/navigation";

export function NavigationSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as NavigationProps,
  }));

  const links = props.links || [];

  const updateLink = (index: number, field: keyof NavLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setProp((p: NavigationProps) => (p.links = newLinks));
  };

  const addLink = () => {
    setProp((p: NavigationProps) => {
      p.links = [...(p.links || []), { label: "New Link", href: "#" }];
    });
  };

  const removeLink = (index: number) => {
    setProp((p: NavigationProps) => {
      p.links = (p.links || []).filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Logo
        </h4>

        <div className="space-y-2">
          <Label htmlFor="logoText">Logo Text</Label>
          <Input
            id="logoText"
            value={props.logoText || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.logoText = e.target.value))}
            placeholder="Company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo URL (optional)</Label>
          <Input
            id="logo"
            value={props.logo || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.logo = e.target.value))}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Links
          </h4>
          <Button size="sm" variant="outline" onClick={addLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </div>

        <div className="space-y-4">
          {links.map((link, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Link {index + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                placeholder="Label"
              />
              <Input
                value={link.href}
                onChange={(e) => updateLink(index, "href", e.target.value)}
                placeholder="URL"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          CTA Button
        </h4>

        <div className="space-y-2">
          <Label htmlFor="ctaText">Button Text</Label>
          <Input
            id="ctaText"
            value={props.ctaText || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.ctaText = e.target.value))}
            placeholder="Get Started"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaHref">Button Link</Label>
          <Input
            id="ctaHref"
            value={props.ctaHref || ""}
            onChange={(e) => setProp((p: NavigationProps) => (p.ctaHref = e.target.value))}
            placeholder="#"
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Options
        </h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="sticky">Sticky Header</Label>
          <Switch
            id="sticky"
            checked={props.sticky ?? false}
            onCheckedChange={(checked) =>
              setProp((p: NavigationProps) => (p.sticky = checked))
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
                setProp((p: NavigationProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.backgroundColor = e.target.value))
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
                setProp((p: NavigationProps) => (p.textColor = e.target.value))
              }
              placeholder="Inherit"
            />
            <input
              type="color"
              value={props.textColor || "#000000"}
              onChange={(e) =>
                setProp((p: NavigationProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
