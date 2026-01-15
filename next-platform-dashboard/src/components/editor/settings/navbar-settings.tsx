"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

export function NavbarSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  const links = props.links as NavLink[];

  const addLink = () => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = props.links as NavLink[];
      props.links = [...currentLinks, { label: "Link", href: "#" }];
    });
  };

  const removeLink = (index: number) => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = props.links as NavLink[];
      props.links = currentLinks.filter((_, i) => i !== index);
    });
  };

  const updateLink = (index: number, field: keyof NavLink, value: string) => {
    setProp((props: Record<string, unknown>) => {
      const currentLinks = [...(props.links as NavLink[])];
      currentLinks[index] = { ...currentLinks[index], [field]: value };
      props.links = currentLinks;
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["logo", "style", "links"]}>
        {/* Logo */}
        <AccordionItem value="logo">
          <AccordionTrigger>Logo</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={props.logo as string}
                onChange={(e) => setProp((props: Record<string, unknown>) => (props.logo = e.target.value))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Logo Text (fallback)</Label>
              <Input
                value={props.logoText as string}
                onChange={(e) => setProp((props: Record<string, unknown>) => (props.logoText = e.target.value))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Style */}
        <AccordionItem value="style">
          <AccordionTrigger>Style</AccordionTrigger>
          <AccordionContent className="space-y-4">
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

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={props.textColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.textColor = e.target.value))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={props.textColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.textColor = e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Sticky Navigation</Label>
              <Switch
                checked={props.sticky as boolean}
                onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.sticky = checked))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Links */}
        <AccordionItem value="links">
          <AccordionTrigger>Links ({links.length})</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={link.href}
                  onChange={(e) => updateLink(index, "href", e.target.value)}
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
              Add Link
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
