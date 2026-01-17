"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Rocket, 
  Trash2, 
  History,
  RotateCcw,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { ModuleDeployDialog } from "@/components/admin/modules/module-deploy-dialog";
import {
  getModuleSource,
  updateModule,
  deleteModule,
  validateModuleCode,
  type ModuleSource,
} from "@/lib/modules/module-builder";
import { 
  getModuleVersions, 
  rollbackToVersion,
  type ModuleVersion 
} from "@/lib/modules/module-versioning";
import { getDeployments, type Deployment } from "@/lib/modules/module-deployer";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  testing: {
    label: "Testing",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  deprecated: {
    label: "Deprecated",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const deploymentStatusIcons = {
  pending: Clock,
  deploying: Loader2,
  success: CheckCircle,
  failed: AlertCircle,
  rolled_back: RotateCcw,
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function EditModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = use(params);
  const router = useRouter();

  const [module, setModule] = useState<ModuleSource | null>(null);
  const [versions, setVersions] = useState<ModuleVersion[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("versions");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState("other");
  const [pricingTier, setPricingTier] = useState("free");
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Code state
  const [renderCode, setRenderCode] = useState("");
  const [styles, setStyles] = useState("");
  const [settingsSchema, setSettingsSchema] = useState("{}");

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  const loadModule = useCallback(async () => {
    setLoading(true);
    
    const [data, versionData, deploymentData] = await Promise.all([
      getModuleSource(moduleId),
      getModuleVersions(moduleId),
      getDeployments(moduleId),
    ]);

    if (data) {
      setModule(data);
      setName(data.name);
      setDescription(data.description);
      setIcon(data.icon);
      setCategory(data.category);
      setPricingTier(data.pricingTier);
      setDependencies(data.dependencies || []);
      setRenderCode(data.renderCode || "");
      setStyles(data.styles || "");
      setSettingsSchema(JSON.stringify(data.settingsSchema || {}, null, 2));
      setHasChanges(false);
    }

    setVersions(versionData);
    setDeployments(deploymentData);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    loadModule();
  }, [loadModule]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setHasChanges(true);
    switch (field) {
      case "name":
        setName(value as string);
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
  }, []);

  const handleCodeChange = useCallback((setter: (v: string) => void) => (value: string) => {
    setHasChanges(true);
    setter(value);
  }, []);

  const handleValidate = useCallback(async () => {
    return validateModuleCode(renderCode, settingsSchema);
  }, [renderCode, settingsSchema]);

  const handleSave = async () => {
    // Validate
    const validation = await validateModuleCode(renderCode, settingsSchema);
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors[0]}`);
      return;
    }

    setSaving(true);

    try {
      let parsedSchema = {};
      try {
        parsedSchema = settingsSchema?.trim() ? JSON.parse(settingsSchema) : {};
      } catch {
        toast.error("Invalid JSON in settings schema");
        setSaving(false);
        return;
      }

      const result = await updateModule(moduleId, {
        name,
        description,
        icon,
        category,
        pricingTier: pricingTier as "free" | "starter" | "pro" | "enterprise",
        renderCode,
        settingsSchema: parsedSchema,
        styles,
        dependencies,
      });

      if (result.success) {
        toast.success("Module saved successfully");
        setHasChanges(false);
        loadModule();
      } else {
        toast.error(result.error || "Failed to save module");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An unexpected error occurred");
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    const result = await deleteModule(moduleId);
    if (result.success) {
      toast.success("Module deleted");
      router.push("/admin/modules/studio");
    } else {
      toast.error(result.error || "Failed to delete module");
    }
  };

  const handleRollback = async (versionId: string) => {
    const result = await rollbackToVersion(moduleId, versionId);
    if (result.success) {
      toast.success("Rolled back to selected version");
      loadModule();
    } else {
      toast.error(result.error || "Failed to rollback");
    }
  };

  const handleCopySlug = () => {
    if (module) {
      navigator.clipboard.writeText(module.slug);
      toast.success("Slug copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-medium">Module not found</h2>
        <p className="text-muted-foreground">
          The module you're looking for doesn't exist or you don't have access.
        </p>
        <Button asChild>
          <Link href="/admin/modules/studio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studio
          </Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[module.status] || statusConfig.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/modules/studio">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{name}</h1>
                  <Badge variant="secondary" className={status.color}>
                    {status.label}
                  </Badge>
                  {hasChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Unsaved changes
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                    {module.slug}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={handleCopySlug}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy slug</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm">•</span>
                  <span className="text-sm">v{module.latestVersion || "0.0.1"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{name}" and all its versions and deployment history.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Module
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={() => setDeployOpen(true)}>
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>

            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar: Config & History */}
        <div className="xl:col-span-1 space-y-6">
          <ModuleConfigForm
            name={name}
            slug={module.slug}
            description={description}
            icon={icon}
            category={category}
            pricingTier={pricingTier}
            dependencies={dependencies}
            onChange={handleFieldChange}
          />

          {/* Version & Deployment History */}
          <Card>
            <CardHeader className="pb-3">
              <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="versions" className="flex-1 gap-1">
                    <History className="h-3.5 w-3.5" />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger value="deploys" className="flex-1 gap-1">
                    <Rocket className="h-3.5 w-3.5" />
                    Deploys
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              {sidebarTab === "versions" ? (
                versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No versions yet. Deploy to create a version.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-start justify-between text-sm p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                              v{v.version}
                            </code>
                            {v.isBreakingChange && (
                              <Badge variant="outline" className="text-xs">
                                Breaking
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs truncate">
                            {v.changelog || "No changelog"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatRelativeDate(v.createdAt)}
                          </p>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => handleRollback(v.id)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rollback to this version</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                deployments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No deployments yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deployments.map((d) => {
                      const StatusIcon = deploymentStatusIcons[d.status] || Clock;
                      return (
                        <div
                          key={d.id}
                          className="flex items-start gap-2 text-sm p-2 rounded-lg hover:bg-muted/50"
                        >
                          <StatusIcon 
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              d.status === "success" ? "text-green-500" :
                              d.status === "failed" ? "text-red-500" :
                              d.status === "deploying" ? "animate-spin text-blue-500" :
                              "text-muted-foreground"
                            }`} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono">v{d.version}</code>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  d.environment === "production" 
                                    ? "border-green-300 text-green-700" 
                                    : "border-yellow-300 text-yellow-700"
                                }`}
                              >
                                {d.environment}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs capitalize">
                              {d.status.replace("_", " ")}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatRelativeDate(d.startedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Code Editor */}
        <div className="xl:col-span-3 h-[700px]">
          <ModuleCodeEditor
            renderCode={renderCode}
            styles={styles}
            settingsSchema={settingsSchema}
            onRenderCodeChange={handleCodeChange(setRenderCode)}
            onStylesChange={handleCodeChange(setStyles)}
            onSettingsSchemaChange={handleCodeChange(setSettingsSchema)}
            onValidate={handleValidate}
          />
        </div>
      </div>

      {/* Deploy Dialog */}
      <ModuleDeployDialog
        open={deployOpen}
        onOpenChange={setDeployOpen}
        moduleId={moduleId}
        moduleName={name}
        currentVersion={module.latestVersion || "0.0.0"}
        onSuccess={() => {
          loadModule();
        }}
      />
    </div>
  );
}
