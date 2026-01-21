"use client";

/**
 * Template Picker Component
 * Phase EM-22: Module Templates Library
 *
 * A compact picker for selecting module templates in forms.
 */

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MODULE_TEMPLATES,
  ModuleTemplate,
} from "@/lib/modules/templates/template-registry";

interface TemplatePickerProps {
  value?: string;
  onSelect: (template: ModuleTemplate | null) => void;
  category?: "basic" | "business" | "industry";
  disabled?: boolean;
  placeholder?: string;
}

export function TemplatePicker({
  value,
  onSelect,
  category,
  disabled,
  placeholder = "Select a template...",
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);

  const templates = category
    ? MODULE_TEMPLATES.filter((t) => t.category === category)
    : MODULE_TEMPLATES;

  const selectedTemplate = templates.find((t) => t.id === value);

  const groupedTemplates = {
    basic: templates.filter((t) => t.category === "basic"),
    business: templates.filter((t) => t.category === "business"),
    industry: templates.filter((t) => t.category === "industry"),
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedTemplate ? (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{selectedTemplate.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {selectedTemplate.category}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No template found.</CommandEmpty>

            {!category && groupedTemplates.basic.length > 0 && (
              <CommandGroup heading="Basic Templates">
                {groupedTemplates.basic.map((template) => (
                  <TemplateCommandItem
                    key={template.id}
                    template={template}
                    isSelected={value === template.id}
                    onSelect={() => {
                      onSelect(template);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}

            {!category && groupedTemplates.business.length > 0 && (
              <CommandGroup heading="Business Templates">
                {groupedTemplates.business.map((template) => (
                  <TemplateCommandItem
                    key={template.id}
                    template={template}
                    isSelected={value === template.id}
                    onSelect={() => {
                      onSelect(template);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}

            {!category && groupedTemplates.industry.length > 0 && (
              <CommandGroup heading="Industry Templates">
                {groupedTemplates.industry.map((template) => (
                  <TemplateCommandItem
                    key={template.id}
                    template={template}
                    isSelected={value === template.id}
                    onSelect={() => {
                      onSelect(template);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}

            {category && (
              <CommandGroup>
                {templates.map((template) => (
                  <TemplateCommandItem
                    key={template.id}
                    template={template}
                    isSelected={value === template.id}
                    onSelect={() => {
                      onSelect(template);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface TemplateCommandItemProps {
  template: ModuleTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCommandItem({
  template,
  isSelected,
  onSelect,
}: TemplateCommandItemProps) {
  return (
    <CommandItem
      value={template.name}
      onSelect={onSelect}
      className="flex items-start gap-2 py-2"
    >
      <Check
        className={cn(
          "mt-0.5 h-4 w-4",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{template.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              template.complexity === "beginner" && "border-green-500 text-green-700",
              template.complexity === "intermediate" && "border-yellow-500 text-yellow-700",
              template.complexity === "advanced" && "border-red-500 text-red-700"
            )}
          >
            {template.complexity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {template.description}
        </p>
      </div>
    </CommandItem>
  );
}

export default TemplatePicker;
