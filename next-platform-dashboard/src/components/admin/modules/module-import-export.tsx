"use client";

import { useRef, useState } from "react";
import { Upload, Download, FileJson, FileCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export interface ModulePackage {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  version?: string;
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  pricingTier?: string;
  dependencies?: string[];
  apiRoutes?: Array<{ path: string; method: string; handler: string }>;
}

interface ModuleImportExportProps {
  module?: ModulePackage | null;
  onImport: (module: ModulePackage) => void;
  trigger?: React.ReactNode;
}

// TypeScript template for module development
const MODULE_TEMPLATE = `// Module: [Your Module Name]
// Description: [What this module does]
// Author: [Your Name]

interface ModuleSettings {
  // Define your settings interface here
  title?: string;
  showBorder?: boolean;
  backgroundColor?: string;
}

interface ModuleProps {
  settings: ModuleSettings;
}

// Main module component - this is what gets rendered
export default function Module({ settings }: ModuleProps) {
  const {
    title = "Hello World",
    showBorder = false,
    backgroundColor = "#ffffff",
  } = settings;

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor,
        border: showBorder ? "1px solid #e5e7eb" : "none",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "12px" }}>
        {title}
      </h2>
      <p style={{ color: "#6b7280" }}>
        This is a sample module. Edit the code to customize it!
      </p>
    </div>
  );
}

// Alternative: Named export also works
// export function Module({ settings }) { ... }
`;

const SETTINGS_SCHEMA_TEMPLATE = `{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "title": "Title",
      "default": "Hello World",
      "description": "The main title text"
    },
    "showBorder": {
      "type": "boolean",
      "title": "Show Border",
      "default": false,
      "description": "Display a border around the module"
    },
    "backgroundColor": {
      "type": "string",
      "title": "Background Color",
      "default": "#ffffff",
      "format": "color",
      "description": "The background color of the module"
    }
  }
}`;

const CSS_TEMPLATE = `/* Module Styles */
/* These styles are scoped to your module */

.module-container {
  padding: 20px;
  border-radius: 8px;
}

.module-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.module-content {
  color: #6b7280;
}

/* Responsive styles */
@media (max-width: 640px) {
  .module-container {
    padding: 12px;
  }
  .module-title {
    font-size: 18px;
  }
}
`;

export function ModuleImportExport({
  module,
  onImport,
  trigger,
}: ModuleImportExportProps) {
  const [open, setOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImportJson() {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJson);
      
      // Validate required fields
      if (!parsed.name) throw new Error("Module name is required");
      if (!parsed.slug) throw new Error("Module slug is required");
      if (!parsed.renderCode) throw new Error("Render code is required");
      
      // Normalize the package
      const normalized: ModulePackage = {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || "",
        icon: parsed.icon || "📦",
        category: parsed.category || "other",
        version: parsed.version,
        renderCode: parsed.renderCode,
        settingsSchema: parsed.settingsSchema || {},
        styles: parsed.styles || "",
        defaultSettings: parsed.defaultSettings || {},
        pricingTier: parsed.pricingTier || "free",
        dependencies: parsed.dependencies || [],
        apiRoutes: parsed.apiRoutes || [],
      };
      
      onImport(normalized);
      setOpen(false);
      setImportJson("");
      toast.success("Module imported successfully");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportJson(content);
      setImportError(null);
    };
    reader.onerror = () => {
      setImportError("Failed to read file");
    };
    reader.readAsText(file);
  }

  function exportModule() {
    if (!module) return;
    
    const exportData = {
      name: module.name,
      slug: module.slug,
      description: module.description,
      icon: module.icon,
      category: module.category,
      version: module.version || "0.0.1",
      renderCode: module.renderCode,
      settingsSchema: module.settingsSchema,
      styles: module.styles,
      defaultSettings: module.defaultSettings,
      pricingTier: module.pricingTier,
      dependencies: module.dependencies,
      apiRoutes: module.apiRoutes,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.slug}-module.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Module exported");
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import/Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import / Export Module</DialogTitle>
          <DialogDescription>
            Import a module from JSON or export the current module for backup or sharing
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export" disabled={!module}>Export</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4 mt-4">
            <div>
              <Label>Upload JSON File</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Select JSON File
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or paste JSON
                </span>
              </div>
            </div>
            
            <div>
              <Label>Module JSON</Label>
              <Textarea
                value={importJson}
                onChange={(e) => {
                  setImportJson(e.target.value);
                  setImportError(null);
                }}
                placeholder='{"name": "My Module", "slug": "my-module", "renderCode": "..."}'
                rows={12}
                className="font-mono text-sm mt-2"
              />
            </div>
            
            {importError && (
              <Alert variant="destructive">
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            <Button onClick={handleImportJson} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Import Module
            </Button>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4 mt-4">
            {module && (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{module.icon}</span>
                    <div>
                      <h3 className="font-medium">{module.name}</h3>
                      <p className="text-sm text-muted-foreground">{module.slug}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                
                <Button onClick={exportModule} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download as JSON
                </Button>
                
                <div>
                  <Label>Preview</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(module, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4 mt-4">
            <Alert>
              <FileCode className="h-4 w-4" />
              <AlertDescription>
                Use these templates to develop modules in VS Code with AI assistance,
                then paste the code back into the studio.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>React Component Template (TSX)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(MODULE_TEMPLATE, "tsx")}
                  >
                    {copied === "tsx" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                  {MODULE_TEMPLATE}
                </pre>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Settings Schema Template (JSON)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(SETTINGS_SCHEMA_TEMPLATE, "schema")}
                  >
                    {copied === "schema" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                  {SETTINGS_SCHEMA_TEMPLATE}
                </pre>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>CSS Template</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(CSS_TEMPLATE, "css")}
                  >
                    {copied === "css" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                  {CSS_TEMPLATE}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
