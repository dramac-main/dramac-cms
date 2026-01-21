"use client";

/**
 * Template Browser Component
 * Phase EM-22: Module Templates Library
 *
 * A browsable UI for selecting and configuring module templates.
 */

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Clock,
  ArrowRight,
  CheckCircle2,
  Package,
  LayoutGrid,
  Briefcase,
  Building2,
} from "lucide-react";
import {
  MODULE_TEMPLATES,
  ModuleTemplate,
  TemplateVariable,
} from "@/lib/modules/templates/template-registry";

interface TemplateBrowserProps {
  onSelect: (template: ModuleTemplate, variables: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function TemplateBrowser({ onSelect, onCancel }: TemplateBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ModuleTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [activeCategory, setActiveCategory] = useState<string>("basic");

  const categories = [
    { id: "basic", label: "Basic", icon: LayoutGrid },
    { id: "business", label: "Business", icon: Briefcase },
    { id: "industry", label: "Industry", icon: Building2 },
  ] as const;

  const filteredTemplates = useMemo(() => {
    return MODULE_TEMPLATES.filter((t) => {
      const matchesSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = t.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  function handleSelectTemplate(template: ModuleTemplate) {
    setSelectedTemplate(template);
    // Initialize variables with defaults
    const defaults: Record<string, unknown> = {};
    template.variables.forEach((v) => {
      if (v.default !== undefined) {
        defaults[v.name] = v.default;
      }
    });
    setVariables(defaults);
  }

  function handleCreate() {
    if (selectedTemplate) {
      onSelect(selectedTemplate, variables);
    }
  }

  function handleCloseDialog() {
    setSelectedTemplate(null);
    setVariables({});
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Module Templates</h2>
          <p className="text-muted-foreground">
            Choose a template to get started quickly
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = MODULE_TEMPLATES.filter(
              (t) => t.category === category.id
            ).length;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {category.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or category
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Configure {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Variables Form */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuration</h4>
                {selectedTemplate.variables.map((variable) => (
                  <VariableInput
                    key={variable.name}
                    variable={variable}
                    value={variables[variable.name]}
                    onChange={(value) =>
                      setVariables({
                        ...variables,
                        [variable.name]: value,
                      })
                    }
                  />
                ))}
              </div>

              {/* Features */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-3">Features included:</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedTemplate.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dependencies */}
              <div>
                <h4 className="font-medium mb-2">Dependencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.dependencies.map((dep) => (
                    <Badge key={dep} variant="outline">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Module
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: ModuleTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const complexityColors = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors group"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.estimatedSetupTime}
          </div>
          <Badge className={complexityColors[template.complexity]}>
            {template.complexity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface VariableInputProps {
  variable: TemplateVariable;
  value: unknown;
  onChange: (value: unknown) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  switch (variable.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={variable.name}>{variable.label}</Label>
            {variable.description && (
              <p className="text-sm text-muted-foreground">
                {variable.description}
              </p>
            )}
          </div>
          <Switch
            id={variable.name}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.name}>{variable.label}</Label>
          {variable.description && (
            <p className="text-sm text-muted-foreground">
              {variable.description}
            </p>
          )}
          <Select
            value={String(value || "")}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${variable.label}`} />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.name}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {variable.description && (
            <p className="text-sm text-muted-foreground">
              {variable.description}
            </p>
          )}
          <Input
            id={variable.name}
            type="number"
            value={value !== undefined ? String(value) : ""}
            onChange={(e) => onChange(Number(e.target.value))}
            required={variable.required}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={variable.name}>
            {variable.label}
            {variable.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {variable.description && (
            <p className="text-sm text-muted-foreground">
              {variable.description}
            </p>
          )}
          <Input
            id={variable.name}
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            required={variable.required}
            placeholder={`Enter ${variable.label.toLowerCase()}`}
          />
        </div>
      );
  }
}

export default TemplateBrowser;
