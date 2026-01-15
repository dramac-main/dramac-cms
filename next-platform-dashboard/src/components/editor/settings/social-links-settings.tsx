"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

const platformIcons: Record<string, string> = {
  facebook: "📘",
  twitter: "🐦",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  tiktok: "🎵",
  pinterest: "📌",
  github: "🐙",
  discord: "🎮",
};

export function SocialLinksSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  const links = props.links as SocialLink[];

  const addLink = () => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = props.links as SocialLink[];
      props.links = [...currentLinks, { platform: "facebook", url: "#", icon: "📘" }];
    });
  };

  const removeLink = (index: number) => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = props.links as SocialLink[];
      props.links = currentLinks.filter((_, i) => i !== index);
    });
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = [...(props.links as SocialLink[])];
      if (field === "platform") {
        currentLinks[index] = { ...currentLinks[index], platform: value, icon: platformIcons[value] || "🔗" };
      } else {
        currentLinks[index] = { ...currentLinks[index], [field]: value };
      }
      props.links = currentLinks;
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["style", "links"]}>
        {/* Style */}
        <AccordionItem value="style">
          <AccordionTrigger>Style</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Icon Size: {props.iconSize}px</Label>
              <Slider
                value={[props.iconSize as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.iconSize = value))}
                min={16}
                max={48}
                step={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Gap: {props.gap}px</Label>
              <Slider
                value={[props.gap as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.gap = value))}
                min={8}
                max={48}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={props.iconColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.iconColor = e.target.value))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={props.iconColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.iconColor = e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hover Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={props.hoverColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.hoverColor = e.target.value))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={props.hoverColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.hoverColor = e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alignment</Label>
              <ToggleGroup
                type="single"
                value={props.alignment as string}
                onValueChange={(value: string) => value && setProp((props: Record<string, unknown>) => (props.alignment = value))}
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
          </AccordionContent>
        </AccordionItem>

        {/* Links */}
        <AccordionItem value="links">
          <AccordionTrigger>Links ({links.length})</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Select
                  value={link.platform}
                  onValueChange={(value) => updateLink(index, "platform", value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(platformIcons).map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platformIcons[platform]} {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLink} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
