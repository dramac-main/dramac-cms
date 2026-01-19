"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Check,
  FileJson,
  Info,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ModuleManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  main: string;
  permissions: ModulePermission[];
  dependencies: Record<string, string>;
  peerDependencies?: Record<string, string>;
  settings?: ManifestSetting[];
  hooks?: ModuleHook[];
  slots?: ModuleSlot[];
  events?: ModuleEventDef[];
  minPlatformVersion?: string;
}

export type ModulePermission =
  | "storage"
  | "database"
  | "api"
  | "events"
  | "secrets"
  | "settings"
  | "ui:modal"
  | "ui:notification"
  | "network:fetch";

export interface ManifestSetting {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "json";
  label: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface ModuleHook {
  name: string;
  handler: string;
  description?: string;
}

export interface ModuleSlot {
  name: string;
  description?: string;
  accepts?: string[];
}

export interface ModuleEventDef {
  name: string;
  description?: string;
  payload?: string;
}

interface ManifestEditorProps {
  manifest: ModuleManifest;
  onChange: (manifest: ModuleManifest) => void;
  onSave?: () => Promise<void>;
  onValidate?: () => Promise<{ valid: boolean; errors: string[] }>;
  className?: string;
  readOnly?: boolean;
}

// ============================================================================
// Permission Descriptions
// ============================================================================

const PERMISSION_INFO: Record<ModulePermission, { label: string; description: string }> = {
  storage: {
    label: "File Storage",
    description: "Upload and manage files in module storage buckets",
  },
  database: {
    label: "Database Access",
    description: "Store and retrieve data in the module's sandboxed database",
  },
  api: {
    label: "API Routes",
    description: "Create custom API endpoints for the module",
  },
  events: {
    label: "Event System",
    description: "Emit and subscribe to inter-module events",
  },
  secrets: {
    label: "Secrets Access",
    description: "Read encrypted secrets configured by site admins",
  },
  settings: {
    label: "Settings Access",
    description: "Read and write module settings",
  },
  "ui:modal": {
    label: "Modal Dialogs",
    description: "Display modal dialogs to users",
  },
  "ui:notification": {
    label: "Notifications",
    description: "Show toast notifications to users",
  },
  "network:fetch": {
    label: "External Network",
    description: "Make HTTP requests to external APIs",
  },
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_INFO) as ModulePermission[];

// ============================================================================
// Manifest Editor Component
// ============================================================================

export function ManifestEditor({
  manifest,
  onChange,
  onSave,
  onValidate,
  className,
  readOnly = false,
}: ManifestEditorProps) {
  // State
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync JSON content when manifest changes
  useEffect(() => {
    if (jsonMode) {
      setJsonContent(JSON.stringify(manifest, null, 2));
    }
  }, [manifest, jsonMode]);

  // Update manifest field
  const updateField = useCallback(
    <K extends keyof ModuleManifest>(key: K, value: ModuleManifest[K]) => {
      onChange({ ...manifest, [key]: value });
    },
    [manifest, onChange]
  );

  // Toggle permission
  const togglePermission = useCallback(
    (permission: ModulePermission) => {
      const current = manifest.permissions || [];
      if (current.includes(permission)) {
        updateField(
          "permissions",
          current.filter((p) => p !== permission)
        );
      } else {
        updateField("permissions", [...current, permission]);
      }
    },
    [manifest.permissions, updateField]
  );

  // Add setting
  const addSetting = useCallback(() => {
    const settings = manifest.settings || [];
    updateField("settings", [
      ...settings,
      {
        key: `setting_${settings.length + 1}`,
        type: "string",
        label: "New Setting",
      },
    ]);
  }, [manifest.settings, updateField]);

  // Update setting
  const updateSetting = useCallback(
    (index: number, setting: ManifestSetting) => {
      const settings = [...(manifest.settings || [])];
      settings[index] = setting;
      updateField("settings", settings);
    },
    [manifest.settings, updateField]
  );

  // Remove setting
  const removeSetting = useCallback(
    (index: number) => {
      const settings = [...(manifest.settings || [])];
      settings.splice(index, 1);
      updateField("settings", settings);
    },
    [manifest.settings, updateField]
  );

  // Add event
  const addEvent = useCallback(() => {
    const events = manifest.events || [];
    updateField("events", [
      ...events,
      { name: `custom:event_${events.length + 1}` },
    ]);
  }, [manifest.events, updateField]);

  // Update event
  const updateEvent = useCallback(
    (index: number, event: ModuleEventDef) => {
      const events = [...(manifest.events || [])];
      events[index] = event;
      updateField("events", events);
    },
    [manifest.events, updateField]
  );

  // Remove event
  const removeEvent = useCallback(
    (index: number) => {
      const events = [...(manifest.events || [])];
      events.splice(index, 1);
      updateField("events", events);
    },
    [manifest.events, updateField]
  );

  // Handle JSON edit
  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonContent(value);
      setJsonError(null);

      try {
        const parsed = JSON.parse(value) as ModuleManifest;
        onChange(parsed);
      } catch (err) {
        setJsonError(err instanceof Error ? err.message : "Invalid JSON");
      }
    },
    [onChange]
  );

  // Validate
  const handleValidate = useCallback(async () => {
    if (onValidate) {
      const result = await onValidate();
      setValidationResult(result);
      return;
    }

    // Basic validation
    const errors: string[] = [];

    if (!manifest.name?.trim()) {
      errors.push("Module name is required");
    } else if (!/^[a-z][a-z0-9-]*$/.test(manifest.name)) {
      errors.push("Module name must be lowercase with hyphens only");
    }

    if (!manifest.version?.trim()) {
      errors.push("Version is required");
    } else if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(manifest.version)) {
      errors.push("Version must be valid semver (e.g., 1.0.0)");
    }

    if (!manifest.displayName?.trim()) {
      errors.push("Display name is required");
    }

    if (!manifest.main?.trim()) {
      errors.push("Main entry point is required");
    }

    setValidationResult({
      valid: errors.length === 0,
      errors,
    });
  }, [manifest, onValidate]);

  // Save
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  }, [onSave]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Module Manifest
            </CardTitle>
            <CardDescription className="mt-1">
              Configure module metadata, permissions, and settings schema
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="jsonMode" className="text-sm">
                JSON Mode
              </Label>
              <Switch
                id="jsonMode"
                checked={jsonMode}
                onCheckedChange={setJsonMode}
              />
            </div>
            {!readOnly && onSave && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-auto">
        {/* Validation Result */}
        {validationResult && (
          <div
            className={cn(
              "flex items-start gap-2 p-3 mb-4 rounded-md text-sm",
              validationResult.valid
                ? "bg-green-500/10 border border-green-500/20 text-green-600"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            )}
          >
            {validationResult.valid ? (
              <>
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Manifest is valid</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Validation errors:</p>
                  <ul className="list-disc list-inside mt-1">
                    {validationResult.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setValidationResult(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {jsonMode ? (
          // JSON Editor Mode
          <div className="space-y-2">
            {jsonError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {jsonError}
              </div>
            )}
            <Textarea
              className="font-mono text-sm h-[500px]"
              value={jsonContent}
              onChange={(e) => handleJsonChange(e.target.value)}
              readOnly={readOnly}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
            >
              Validate JSON
            </Button>
          </div>
        ) : (
          // Form Mode
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="settings">Settings Schema</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Module Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="my-module"
                    value={manifest.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    readOnly={readOnly}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase, hyphens only (e.g., my-module)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">
                    Version <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={manifest.version || ""}
                    onChange={(e) => updateField("version", e.target.value)}
                    readOnly={readOnly}
                  />
                  <p className="text-xs text-muted-foreground">
                    Semantic version (e.g., 1.0.0)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="My Module"
                  value={manifest.displayName || ""}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  readOnly={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does this module do?"
                  value={manifest.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  readOnly={readOnly}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Your Name"
                    value={manifest.author || ""}
                    onChange={(e) => updateField("author", e.target.value)}
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License</Label>
                  <Input
                    id="license"
                    placeholder="MIT"
                    value={manifest.license || ""}
                    onChange={(e) => updateField("license", e.target.value)}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homepage">Homepage URL</Label>
                  <Input
                    id="homepage"
                    placeholder="https://example.com"
                    value={manifest.homepage || ""}
                    onChange={(e) => updateField("homepage", e.target.value)}
                    readOnly={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository URL</Label>
                  <Input
                    id="repository"
                    placeholder="https://github.com/..."
                    value={manifest.repository || ""}
                    onChange={(e) => updateField("repository", e.target.value)}
                    readOnly={readOnly}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="main">
                  Main Entry Point <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="main"
                  placeholder="index.tsx"
                  value={manifest.main || ""}
                  onChange={(e) => updateField("main", e.target.value)}
                  readOnly={readOnly}
                />
                <p className="text-xs text-muted-foreground">
                  The main file that exports your module component
                </p>
              </div>

              <Button variant="outline" onClick={handleValidate}>
                Validate Manifest
              </Button>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the permissions your module requires. Users will see
                  these when installing your module.
                </p>

                <div className="grid gap-3">
                  {ALL_PERMISSIONS.map((permission) => {
                    const info = PERMISSION_INFO[permission];
                    const isEnabled = manifest.permissions?.includes(permission);

                    return (
                      <div
                        key={permission}
                        className={cn(
                          "flex items-start gap-3 p-3 border rounded-lg transition-colors",
                          isEnabled && "border-primary bg-primary/5"
                        )}
                      >
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => togglePermission(permission)}
                          disabled={readOnly}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{info.label}</span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {permission}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Define configurable settings for your module.
                  </p>
                  {!readOnly && (
                    <Button variant="outline" size="sm" onClick={addSetting}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Setting
                    </Button>
                  )}
                </div>

                {(manifest.settings || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No settings defined
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(manifest.settings || []).map((setting, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <div className="space-y-2">
                              <Label>Key</Label>
                              <Input
                                placeholder="setting_key"
                                value={setting.key}
                                onChange={(e) =>
                                  updateSetting(index, {
                                    ...setting,
                                    key: e.target.value,
                                  })
                                }
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={setting.type}
                                onValueChange={(v) =>
                                  updateSetting(index, {
                                    ...setting,
                                    type: v as ManifestSetting["type"],
                                  })
                                }
                                disabled={readOnly}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                  <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Label</Label>
                              <Input
                                placeholder="Display Label"
                                value={setting.label}
                                onChange={(e) =>
                                  updateSetting(index, {
                                    ...setting,
                                    label: e.target.value,
                                  })
                                }
                                readOnly={readOnly}
                              />
                            </div>
                          </div>
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive ml-2"
                              onClick={() => removeSetting(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="What does this setting do?"
                            value={setting.description || ""}
                            onChange={(e) =>
                              updateSetting(index, {
                                ...setting,
                                description: e.target.value,
                              })
                            }
                            readOnly={readOnly}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={setting.required || false}
                              onCheckedChange={(checked) =>
                                updateSetting(index, {
                                  ...setting,
                                  required: checked,
                                })
                              }
                              disabled={readOnly}
                            />
                            <Label className="text-sm">Required</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Define events that your module can emit.
                  </p>
                  {!readOnly && (
                    <Button variant="outline" size="sm" onClick={addEvent}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Event
                    </Button>
                  )}
                </div>

                {(manifest.events || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No events defined
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(manifest.events || []).map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Event Name</Label>
                            <Input
                              placeholder="namespace:action"
                              value={event.name}
                              onChange={(e) =>
                                updateEvent(index, {
                                  ...event,
                                  name: e.target.value,
                                })
                              }
                              readOnly={readOnly}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="What triggers this event?"
                              value={event.description || ""}
                              onChange={(e) =>
                                updateEvent(index, {
                                  ...event,
                                  description: e.target.value,
                                })
                              }
                              readOnly={readOnly}
                              className="h-8"
                            />
                          </div>
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeEvent(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Event naming convention:</p>
                      <p className="mt-1">
                        Use the format <code className="px-1 bg-background rounded">namespace:action</code>,
                        e.g., <code className="px-1 bg-background rounded">form:submitted</code> or{" "}
                        <code className="px-1 bg-background rounded">data:updated</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default ManifestEditor;
