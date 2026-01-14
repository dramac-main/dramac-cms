"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { FooterProps, SocialLink } from "../user-components/footer";

export function FooterSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FooterProps,
  }));

  const columns = props.columns || [];
  const socialLinks = props.socialLinks || [];

  // Column management
  const updateColumnTitle = (index: number, title: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], title };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const addLinkToColumn = (columnIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: [...newColumns[columnIndex].links, { label: "New Link", href: "#" }],
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const updateColumnLink = (
    columnIndex: number,
    linkIndex: number,
    field: "label" | "href",
    value: string
  ) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links[linkIndex] = {
      ...newColumns[columnIndex].links[linkIndex],
      [field]: value,
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const removeColumnLink = (columnIndex: number, linkIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: newColumns[columnIndex].links.filter((_, i) => i !== linkIndex),
    };
    setProp((p: FooterProps) => (p.columns = newColumns));
  };

  const addColumn = () => {
    setProp((p: FooterProps) => {
      p.columns = [...(p.columns || []), { title: "New Column", links: [] }];
    });
  };

  const removeColumn = (index: number) => {
    setProp((p: FooterProps) => {
      p.columns = (p.columns || []).filter((_, i) => i !== index);
    });
  };

  // Social links management
  const addSocialLink = () => {
    setProp((p: FooterProps) => {
      p.socialLinks = [...(p.socialLinks || []), { platform: "twitter", href: "#" }];
    });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newSocials = [...socialLinks];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setProp((p: FooterProps) => (p.socialLinks = newSocials));
  };

  const removeSocialLink = (index: number) => {
    setProp((p: FooterProps) => {
      p.socialLinks = (p.socialLinks || []).filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Brand
        </h4>

        <div className="space-y-2">
          <Label htmlFor="logoText">Logo Text</Label>
          <Input
            id="logoText"
            value={props.logoText || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.logoText = e.target.value))}
            placeholder="Company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={props.tagline || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.tagline = e.target.value))}
            placeholder="Company tagline"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="copyright">Copyright Text</Label>
          <Input
            id="copyright"
            value={props.copyright || ""}
            onChange={(e) => setProp((p: FooterProps) => (p.copyright = e.target.value))}
            placeholder="© 2025 Company..."
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Social Links
          </h4>
          <Button size="sm" variant="outline" onClick={addSocialLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {socialLinks.map((social, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={social.platform}
                onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                placeholder="Platform"
                className="flex-1"
              />
              <Input
                value={social.href}
                onChange={(e) => updateSocialLink(index, "href", e.target.value)}
                placeholder="URL"
                className="flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeSocialLink(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Link Columns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Link Columns
          </h4>
          <Button size="sm" variant="outline" onClick={addColumn}>
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
        </div>

        <div className="space-y-4">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={column.title}
                  onChange={(e) => updateColumnTitle(columnIndex, e.target.value)}
                  placeholder="Column title"
                  className="flex-1 mr-2"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeColumn(columnIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Column Links */}
              <div className="space-y-2 ml-2">
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-2 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, "label", e.target.value)
                      }
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateColumnLink(columnIndex, linkIndex, "href", e.target.value)
                      }
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => removeColumnLink(columnIndex, linkIndex)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => addLinkToColumn(columnIndex)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </div>
            </div>
          ))}
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
                setProp((p: FooterProps) => (p.backgroundColor = e.target.value))
              }
              placeholder="#1a1a2e"
            />
            <input
              type="color"
              value={props.backgroundColor || "#1a1a2e"}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.backgroundColor = e.target.value))
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
                setProp((p: FooterProps) => (p.textColor = e.target.value))
              }
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={props.textColor || "#ffffff"}
              onChange={(e) =>
                setProp((p: FooterProps) => (p.textColor = e.target.value))
              }
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
