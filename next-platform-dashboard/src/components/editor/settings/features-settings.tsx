"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export function FeaturesSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  const features = props.features as Feature[];

  const addFeature = () => {
    setProp((props: Record<string, unknown>) => {
      const currentFeatures = props.features as Feature[];
      props.features = [...currentFeatures, { icon: "✨", title: "New Feature", description: "Feature description" }];
    });
  };

  const removeFeature = (index: number) => {
    setProp((props: Record<string, unknown>) => {
      const currentFeatures = props.features as Feature[];
      props.features = currentFeatures.filter((_, i) => i !== index);
    });
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    setProp((props: Record<string, unknown>) => {
      const currentFeatures = [...(props.features as Feature[])];
      currentFeatures[index] = { ...currentFeatures[index], [field]: value };
      props.features = currentFeatures;
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["content", "style"]}>
        {/* Content */}
        <AccordionItem value="content">
          <AccordionTrigger>Content</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={props.title as string}
                onChange={(e) => setProp((props: Record<string, unknown>) => (props.title = e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={props.subtitle as string}
                onChange={(e) => setProp((props: Record<string, unknown>) => (props.subtitle = e.target.value))}
                rows={2}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Style */}
        <AccordionItem value="style">
          <AccordionTrigger>Style</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select
                value={String(props.columns)}
                onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.columns = parseInt(value)))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </AccordionContent>
        </AccordionItem>

        {/* Features */}
        <AccordionItem value="features">
          <AccordionTrigger>Features ({features.length})</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Feature {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Icon (emoji)"
                  value={feature.icon}
                  onChange={(e) => updateFeature(index, "icon", e.target.value)}
                />
                <Input
                  placeholder="Title"
                  value={feature.title}
                  onChange={(e) => updateFeature(index, "title", e.target.value)}
                />
                <Textarea
                  placeholder="Description"
                  value={feature.description}
                  onChange={(e) => updateFeature(index, "description", e.target.value)}
                  rows={2}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFeature} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
