"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Code, Info, Database, Settings2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { ModuleTypeSelector } from "@/components/admin/modules/module-type-selector";
import { DatabaseSchemaBuilder } from "@/components/admin/modules/database-schema-builder";
import { createModule, validateModuleCode } from "@/lib/modules/module-builder";
import { 
  getDefaultCapabilities, 
  getDefaultIsolation, 
  getDefaultResources,
  type ModuleType, 
  type ModuleCapabilities,
  type DatabaseIsolation,
  type ModuleTable
} from "@/lib/modules/types/module-types-v2";
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
  const [activeTab, setActiveTab] = useState("basics");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState("other");
  const [pricingTier, setPricingTier] = useState("free");
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Phase EM-10: Module Type System state
  const [moduleType, setModuleType] = useState<ModuleType>("widget");
  const [capabilities, setCapabilities] = useState<ModuleCapabilities>(getDefaultCapabilities("widget"));
  const [dbIsolation, setDbIsolation] = useState<DatabaseIsolation>(getDefaultIsolation("widget"));
  const [tables, setTables] = useState<ModuleTable[]>([]);

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
        // Phase EM-10: Module Type System
        moduleType,
        dbIsolation,
        capabilities,
        resources: capabilities.has_database ? {
          tables,
          storage_buckets: [],
          edge_functions: [],
          scheduled_jobs: [],
          webhooks: []
        } : getDefaultResources(),
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

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Basics
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Type & Capabilities
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2" disabled={!capabilities.has_database}>
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
        </TabsList>

        {/* Tab: Basics */}
        <TabsContent value="basics" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure the basic information for your module. The name and slug are required.
            </AlertDescription>
          </Alert>
          
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
        </TabsContent>

        {/* Tab: Type & Capabilities */}
        <TabsContent value="type" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select the type of module you&apos;re building. This determines the default capabilities
              and how the module is deployed. More complex types support more features.
            </AlertDescription>
          </Alert>
          
          <ModuleTypeSelector
            selectedType={moduleType}
            capabilities={capabilities}
            dbIsolation={dbIsolation}
            onTypeChange={setModuleType}
            onCapabilitiesChange={setCapabilities}
            onIsolationChange={setDbIsolation}
            showAdvanced={capabilities.has_database}
          />
        </TabsContent>

        {/* Tab: Database */}
        <TabsContent value="database" className="mt-6">
          {capabilities.has_database ? (
            <>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Define the database tables your module needs. Tables will be created with a 
                  unique prefix (mod_[id]_) to prevent conflicts. Common columns like id, 
                  created_at, and updated_at are added automatically.
                </AlertDescription>
              </Alert>
              
              <DatabaseSchemaBuilder
                tables={tables}
                onChange={setTables}
                shortId={slug ? slug.replace(/[^a-z0-9]/gi, '').substring(0, 8).toLowerCase() : undefined}
              />
            </>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Database Not Enabled</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                Enable the &quot;Database&quot; capability in the Type &amp; Capabilities tab to define 
                database tables for this module.
              </p>
              <Button variant="outline" onClick={() => setActiveTab("type")}>
                Configure Capabilities
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab: Code */}
        <TabsContent value="code" className="mt-6">
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Write the render code for your module. The code defines how your module looks,
              the settings schema defines configuration options, and styles add custom CSS.
            </AlertDescription>
          </Alert>
          
          <div className="h-175">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
