"use client";

import { useNode } from "@craftjs/core";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsInput } from "./settings-input";
import { SettingsSelect } from "./settings-select";
import { SettingsColor } from "./settings-color";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { FeatureGridProps, FeatureItem } from "../user-components/feature-grid";

const columnOptions = [
  { value: "2", label: "2 Columns" },
  { value: "3", label: "3 Columns" },
  { value: "4", label: "4 Columns" },
];

const iconOptions = [
  { value: "Zap", label: "Zap" },
  { value: "Shield", label: "Shield" },
  { value: "Sparkles", label: "Sparkles" },
  { value: "Layers", label: "Layers" },
  { value: "Globe", label: "Globe" },
  { value: "Code", label: "Code" },
];

export function FeatureGridSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FeatureGridProps,
  }));

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFeature, setEditFeature] = useState<FeatureItem | null>(null);

  const handleAddFeature = () => {
    const newFeature: FeatureItem = {
      icon: "Zap",
      title: "New Feature",
      description: "Feature description",
    };
    setProp((props: FeatureGridProps) => {
      props.features = [...(props.features || []), newFeature];
    });
  };

  const handleUpdateFeature = () => {
    if (editingIndex === null || !editFeature) return;

    setProp((props: FeatureGridProps) => {
      const features = [...(props.features || [])];
      features[editingIndex] = editFeature;
      props.features = features;
    });
    setEditingIndex(null);
    setEditFeature(null);
  };

  const handleDeleteFeature = (index: number) => {
    setProp((props: FeatureGridProps) => {
      props.features = (props.features || []).filter((_, i) => i !== index);
    });
  };

  const features = props.features || [];

  return (
    <div className="space-y-6">
      {/* Header Content */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Header</h4>

        <SettingsInput
          label="Title"
          value={props.title || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.title = value))
          }
          placeholder="Section title"
        />

        <SettingsInput
          label="Subtitle"
          value={props.subtitle || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.subtitle = value))
          }
          placeholder="Section subtitle"
        />
      </div>

      <Separator />

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Layout</h4>

        <SettingsSelect
          label="Columns"
          value={String(props.columns || 3)}
          onChange={(value) =>
            setProp(
              (props: FeatureGridProps) => (props.columns = Number(value) as 2 | 3 | 4)
            )
          }
          options={columnOptions}
        />
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Colors</h4>

        <SettingsColor
          label="Background Color"
          value={props.backgroundColor || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.backgroundColor = value))
          }
        />

        <SettingsColor
          label="Text Color"
          value={props.textColor || ""}
          onChange={(value) =>
            setProp((props: FeatureGridProps) => (props.textColor = value))
          }
        />
      </div>

      <Separator />

      {/* Features List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Features ({features.length})</h4>
          <Button size="sm" variant="outline" onClick={handleAddFeature}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{feature.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {feature.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditFeature({ ...feature });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Feature</DialogTitle>
                    </DialogHeader>
                    {editFeature && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <select
                            className="w-full h-9 rounded-md border px-3"
                            value={editFeature.icon}
                            onChange={(e) =>
                              setEditFeature({ ...editFeature, icon: e.target.value })
                            }
                          >
                            {iconOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={editFeature.title}
                            onChange={(e) =>
                              setEditFeature({ ...editFeature, title: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={editFeature.description}
                            onChange={(e) =>
                              setEditFeature({
                                ...editFeature,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <Button onClick={handleUpdateFeature} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteFeature(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
