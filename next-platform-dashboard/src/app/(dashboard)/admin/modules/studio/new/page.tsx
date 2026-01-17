"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Code, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { createModule, validateModuleCode } from "@/lib/modules/module-builder";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEFAULT_RENDER_CODE = `// Module Render Component
// This code defines the visual component for your module

import { useNode } from "@craftjs/core";

export function ModuleComponent({ settings }) {
  const { connectors: { connect, drag } } = useNode();
  
  return (
    <div 
      ref={(ref) => connect(drag(ref))} 
      className="p-4 border rounded-lg"
    >
      <h3 className="font-semibold text-lg">
        {settings.title || "My Module"}
      </h3>
      <p className="text-muted-foreground mt-2">
        {settings.description || "Module content goes here"}
      </p>
    </div>
  );
}

// Craft.js configuration
ModuleComponent.craft = {
  displayName: "My Module",
  props: {
    title: "My Module",
    description: "Module content goes here",
  },
  rules: {
    canDrag: () => true,
    canMoveIn: () => false,
  },
};

export default ModuleComponent;
`;

const DEFAULT_SETTINGS_SCHEMA = `{
  "type": "object",
  "title": "Module Settings",
  "properties": {
    "title": {
      "type": "string",
      "title": "Title",
      "description": "The module title displayed to users",
      "default": "My Module"
    },
    "description": {
      "type": "string",
      "title": "Description",
      "description": "A brief description of the module",
      "default": "Module content goes here"
    },
    "showBorder": {
      "type": "boolean",
      "title": "Show Border",
      "description": "Whether to display a border around the module",
      "default": true
    }
  },
  "required": ["title"]
}`;

const DEFAULT_STYLES = `/* Module Custom Styles */

.module-container {
  padding: 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.module-container:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: inherit;
}

.module-description {
  margin-top: 0.5rem;
  color: var(--muted-foreground);
}
`;

export default function CreateModulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState("other");
  const [pricingTier, setPricingTier] = useState("free");
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Code state
  const [renderCode, setRenderCode] = useState(DEFAULT_RENDER_CODE);
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [settingsSchema, setSettingsSchema] = useState(DEFAULT_SETTINGS_SCHEMA);

  const generateSlug = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    switch (field) {
      case "name":
        setName(value as string);
        // Auto-generate slug from name if slug is empty or matches old generated slug
        const newSlug = generateSlug(value as string);
        if (!slug || slug === generateSlug(name)) {
          setSlug(newSlug);
        }
        break;
      case "slug":
        setSlug(value as string);
        break;
      case "description":
        setDescription(value as string);
        break;
      case "icon":
        setIcon(value as string);
        break;
      case "category":
        setCategory(value as string);
        break;
      case "pricingTier":
        setPricingTier(value as string);
        break;
      case "dependencies":
        setDependencies(value as string[]);
        break;
    }
  }, [slug, name, generateSlug]);

  const handleValidate = useCallback(async () => {
    return validateModuleCode(renderCode, settingsSchema);
  }, [renderCode, settingsSchema]);

  const handleSave = async () => {
    // Validate required fields
    if (!name?.trim()) {
      toast.error("Please provide a module name");
      return;
    }
    if (!slug?.trim()) {
      toast.error("Please provide a module slug");
      return;
    }

    // Validate code
    const validation = await validateModuleCode(renderCode, settingsSchema);
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors[0]}`);
      return;
    }

    setSaving(true);

    try {
      // Parse settings schema
      let parsedSchema = {};
      try {
        parsedSchema = settingsSchema?.trim() ? JSON.parse(settingsSchema) : {};
      } catch {
        toast.error("Invalid JSON in settings schema");
        setSaving(false);
        return;
      }

      const result = await createModule({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        icon,
        category,
        pricingTier: pricingTier as "free" | "starter" | "pro" | "enterprise",
        renderCode,
        settingsSchema: parsedSchema,
        apiRoutes: [],
        styles,
        defaultSettings: {},
        dependencies,
      });

      if (result.success) {
        toast.success("Module created successfully!");
        router.push(`/admin/modules/studio/${result.moduleId}`);
      } else {
        toast.error(result.error || "Failed to create module");
      }
    } catch (error) {
      console.error("Create module error:", error);
      toast.error("An unexpected error occurred");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/modules/studio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="h-6 w-6" />
              Create New Module
            </h1>
            <p className="text-muted-foreground">
              Build a new module for the marketplace
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Module
            </>
          )}
        </Button>
      </div>

      {/* Help Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Modules are reusable components that can be installed on sites. 
          The render code defines how your module looks, the settings schema defines
          what options users can configure, and styles add custom CSS.
        </AlertDescription>
      </Alert>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div>
          <ModuleConfigForm
            name={name}
            slug={slug}
            description={description}
            icon={icon}
            category={category}
            pricingTier={pricingTier}
            dependencies={dependencies}
            onChange={handleFieldChange}
            isNew
          />
        </div>

        {/* Right: Code Editor */}
        <div className="h-[700px]">
          <ModuleCodeEditor
            renderCode={renderCode}
            styles={styles}
            settingsSchema={settingsSchema}
            onRenderCodeChange={setRenderCode}
            onStylesChange={setStyles}
            onSettingsSchemaChange={setSettingsSchema}
            onValidate={handleValidate}
          />
        </div>
      </div>
    </div>
  );
}
