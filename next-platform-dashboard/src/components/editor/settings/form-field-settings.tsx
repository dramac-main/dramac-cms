"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FormFieldSettings() {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }));

  const options = props.options as string[];

  const addOption = () => {
    setProp((props: Record<string, unknown>) => {
      const currentOptions = props.options as string[];
      props.options = [...currentOptions, `Option ${currentOptions.length + 1}`];
    });
  };

  const removeOption = (index: number) => {
    setProp((props: Record<string, unknown>) => {
      const currentOptions = props.options as string[];
      props.options = currentOptions.filter((_, i) => i !== index);
    });
  };

  const updateOption = (index: number, value: string) => {
    setProp((props: Record<string, unknown>) => {
      const currentOptions = [...(props.options as string[])];
      currentOptions[index] = value;
      props.options = currentOptions;
    });
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="space-y-2">
        <Label>Field Label</Label>
        <Input
          value={props.label as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.label = e.target.value))}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Field Type</Label>
        <Select
          value={props.type as string}
          onValueChange={(value) => setProp((props: Record<string, unknown>) => (props.type = value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="tel">Phone</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="select">Dropdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Placeholder */}
      <div className="space-y-2">
        <Label>Placeholder</Label>
        <Input
          value={props.placeholder as string}
          onChange={(e) => setProp((props: Record<string, unknown>) => (props.placeholder = e.target.value))}
        />
      </div>

      {/* Required */}
      <div className="flex items-center justify-between">
        <Label>Required</Label>
        <Switch
          checked={props.required as boolean}
          onCheckedChange={(checked) => setProp((props: Record<string, unknown>) => (props.required = checked))}
        />
      </div>

      {/* Options (for select) */}
      {props.type === "select" && (
        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={() => removeOption(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      )}
    </div>
  );
}
