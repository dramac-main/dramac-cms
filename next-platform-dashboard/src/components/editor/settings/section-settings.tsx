"use client";

import { useNode, useEditor } from "@craftjs/core";
import { useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RegenerateButton } from "../ai/regenerate-button";
import type { SectionContent } from "@/lib/ai/regeneration-types";
import { Separator } from "@/components/ui/separator";

export function SectionSettings() {
  const params = useParams();
  const siteId = params?.siteId as string;
  
  const { actions: { setProp }, props, id } = useNode((node) => ({
    props: node.data.props,
    id: node.id,
  }));
  
  const { query } = useEditor();

  // Extract section content for AI regeneration
  const getSectionContent = (): SectionContent => {
    try {
      // Get the node's serialized state which includes children
      const nodeTree = query.node(id).toSerializedNode();
      return {
        type: "section",
        props: nodeTree.props,
        // Include any text content from the node
        text: nodeTree.displayName || "Section",
      };
    } catch {
      return {
        type: "section",
        props: props,
      };
    }
  };

  // Handle regeneration - update the section's content
  const handleRegenerate = (newContent: SectionContent) => {
    if (newContent.props) {
      Object.entries(newContent.props).forEach(([key, value]) => {
        setProp((props: Record<string, unknown>) => {
          props[key] = value;
        });
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Section Regeneration */}
      {siteId && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AI Tools</Label>
            <RegenerateButton
              sectionContent={getSectionContent()}
              siteId={siteId}
              onRegenerate={handleRegenerate}
            />
          </div>
          <Separator />
        </>
      )}
      
      <Accordion type="multiple" defaultValue={["layout", "background", "spacing"]}>
        {/* Layout */}
        <AccordionItem value="layout">
          <AccordionTrigger>Layout</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Max Width</Label>
              <Select
                value={props.maxWidth}
                onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.maxWidth = value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="7xl">7XL (80rem)</SelectItem>
                  <SelectItem value="6xl">6XL (72rem)</SelectItem>
                  <SelectItem value="5xl">5XL (64rem)</SelectItem>
                  <SelectItem value="4xl">4XL (56rem)</SelectItem>
                  <SelectItem value="3xl">3XL (48rem)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Height: {props.minHeight}px</Label>
              <Slider
                value={[props.minHeight as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.minHeight = value))}
                min={0}
                max={800}
                step={10}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Background */}
        <AccordionItem value="background">
          <AccordionTrigger>Background</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={props.backgroundColor === "transparent" ? "#ffffff" : props.backgroundColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={props.backgroundColor as string}
                  onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundColor = e.target.value))}
                  placeholder="transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={(props.backgroundImage as string) || ""}
                onChange={(e) => setProp((props: Record<string, unknown>) => (props.backgroundImage = e.target.value))}
                placeholder="https://..."
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Spacing */}
        <AccordionItem value="spacing">
          <AccordionTrigger>Spacing</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Padding Top: {props.paddingTop}px</Label>
              <Slider
                value={[props.paddingTop as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.paddingTop = value))}
                min={0}
                max={200}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Bottom: {props.paddingBottom}px</Label>
              <Slider
                value={[props.paddingBottom as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.paddingBottom = value))}
                min={0}
                max={200}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Left: {props.paddingLeft}px</Label>
              <Slider
                value={[props.paddingLeft as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.paddingLeft = value))}
                min={0}
                max={100}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Right: {props.paddingRight}px</Label>
              <Slider
                value={[props.paddingRight as number]}
                onValueChange={([value]) => setProp((props: Record<string, unknown>) => (props.paddingRight = value))}
                min={0}
                max={100}
                step={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
