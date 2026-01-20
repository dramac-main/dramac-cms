"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
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
  FlaskConical,
  Upload,
  Package,
  Route,
  FileJson,
  Files,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModuleConfigForm } from "@/components/admin/modules/module-config-form";
import { ModuleCodeEditor } from "@/components/admin/modules/module-code-editor";
import { ModuleDeployDialog } from "@/components/admin/modules/module-deploy-dialog";
import { ModuleImportExport, type ModulePackage } from "@/components/admin/modules/module-import-export";
import {
  MultiFileEditor,
  DependencyManager,
  ApiRouteBuilder,
  ManifestEditor,
  type ModuleFile,
  type Dependency,
  type ApiRoute,
  type ModuleManifest,
} from "@/components/admin/modules/advanced-editor";
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
import { createClient } from "@/lib/supabase/client";

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

  // Phase 81C: Advanced Editor State
  const [editorMode, setEditorMode] = useState<"simple" | "advanced">("simple");
  const [mainTab, setMainTab] = useState("code");
  const [moduleFiles, setModuleFiles] = useState<ModuleFile[]>([]);
  const [moduleDeps, setModuleDeps] = useState<Dependency[]>([]);
  const [apiRoutes, setApiRoutes] = useState<ApiRoute[]>([]);
  const [manifest, setManifest] = useState<ModuleManifest | null>(null);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Track loading errors for better UX
  const [loadError, setLoadError] = useState<string | null>(null);

  // Refs to prevent race conditions in React Strict Mode
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const isLoadingRef = useRef(false);

  const loadModule = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log("[ModuleStudio] Already loading, skipping duplicate request");
      return;
    }
    
    // Track this specific request
    const requestId = ++loadRequestIdRef.current;
    isLoadingRef.current = true;
    
    console.log("[ModuleStudio] Loading module:", moduleId, "requestId:", requestId);
    setLoading(true);
    setLoadError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch all data in parallel (no timeout race - let server timeout handle it)
      const [data, versionData, deploymentData] = await Promise.all([
        getModuleSource(moduleId),
        getModuleVersions(moduleId),
        getDeployments(moduleId),
      ]);
      
      // Check if this response is still relevant (component still mounted, no newer request)
      if (!isMountedRef.current) {
        console.log("[ModuleStudio] Component unmounted, ignoring response");
        return;
      }
      if (requestId !== loadRequestIdRef.current) {
        console.log("[ModuleStudio] Stale response (requestId:", requestId, "current:", loadRequestIdRef.current, "), ignoring");
        return;
      }
      
      console.log("[ModuleStudio] Data loaded:", { 
        hasModule: !!data, 
        versionsCount: versionData?.length || 0, 
        deploymentsCount: deploymentData?.length || 0 
      });

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
        
        // Load Phase 81C data - use data.id (UUID) not moduleId (slug)
        // module_source_id in Phase 81C tables references module_source.id (UUID)
        const moduleSourceId = data.id;
        
        // These tables might not exist in all environments, so wrap in try-catch
        try {
          const [filesResult, depsResult, routesResult, manifestResult] = await Promise.all([
            supabase.from("module_files").select("*").eq("module_source_id", moduleSourceId).order("file_path"),
            supabase.from("module_dependencies").select("*").eq("module_source_id", moduleSourceId),
            supabase.from("module_api_routes").select("*").eq("module_source_id", moduleSourceId),
            supabase.from("module_manifests").select("*").eq("module_source_id", moduleSourceId).maybeSingle(),
          ]);

      if (filesResult.data) {
        // Map database file types to UI file types
        const mapFileType = (dbType: string): ModuleFile["fileType"] => {
          switch (dbType) {
            case "typescript":
            case "javascript":
              return "component";
            case "css":
              return "style";
            case "json":
              return "config";
            case "image":
            case "svg":
              return "asset";
            default:
              return "other";
          }
        };
        
        setModuleFiles(filesResult.data.map(f => ({
          id: f.id,
          path: f.file_path,
          content: f.content || "",
          fileType: mapFileType(f.file_type),
          isModified: false,
          isNew: false,
        })));
        // If there are files, switch to advanced mode
        if (filesResult.data.length > 0) {
          setEditorMode("advanced");
        }
      }

      if (depsResult.data) {
        // Map database dependency fields to UI dependency type
        const getDependencyType = (d: { is_dev_dependency?: boolean | null; is_peer_dependency?: boolean | null }): Dependency["type"] => {
          if (d.is_peer_dependency) return "peer";
          if (d.is_dev_dependency) return "development";
          return "production";
        };
        
        setModuleDeps(depsResult.data.map(d => ({
          name: d.package_name,
          version: d.version || "latest",
          type: getDependencyType(d),
          status: "installed" as const,
        })));
      }

      if (routesResult.data) {
        setApiRoutes(routesResult.data.map(r => ({
          id: r.id,
          path: r.route_path,
          method: (r.methods?.[0] || "GET") as ApiRoute["method"],
          description: r.description || undefined,
          handler: r.handler_code || "",
          rateLimit: r.rate_limit_requests ? {
            requests: r.rate_limit_requests,
            windowMs: r.rate_limit_window_ms || 60000,
          } : undefined,
          cors: r.allowed_origins?.length ? {
            enabled: true,
            origins: r.allowed_origins,
          } : undefined,
          auth: {
            required: r.requires_auth ?? true,
            scopes: [],
          },
          isActive: r.is_enabled ?? true,
          createdAt: r.created_at || undefined,
          updatedAt: r.updated_at || undefined,
        })));
      }

      if (manifestResult.data) {
        // Database stores raw_manifest as JSONB with the full manifest
        // If raw_manifest is populated, use it; otherwise build from database columns
        const rawManifest = manifestResult.data.raw_manifest as Record<string, unknown> | null;
        
        if (rawManifest && typeof rawManifest === "object" && Object.keys(rawManifest).length > 0) {
          // Parse the stored manifest
          setManifest({
            name: (rawManifest.name as string) || data.name,
            version: (rawManifest.version as string) || manifestResult.data.manifest_version || "1.0.0",
            displayName: (rawManifest.displayName as string) || data.name,
            description: (rawManifest.description as string) || data.description,
            author: rawManifest.author as string | undefined,
            license: rawManifest.license as string | undefined,
            homepage: rawManifest.homepage as string | undefined,
            repository: rawManifest.repository as string | undefined,
            main: (rawManifest.main as string) || manifestResult.data.entry_point || "index.tsx",
            permissions: ((rawManifest.permissions as string[]) || manifestResult.data.permissions || []) as ModuleManifest["permissions"],
            dependencies: (rawManifest.dependencies as Record<string, string>) || {},
            peerDependencies: rawManifest.peerDependencies as Record<string, string> | undefined,
            settings: rawManifest.settings as ModuleManifest["settings"],
            hooks: rawManifest.hooks as ModuleManifest["hooks"],
            slots: rawManifest.slots as ModuleManifest["slots"],
            events: rawManifest.events as ModuleManifest["events"],
            minPlatformVersion: rawManifest.minPlatformVersion as string | undefined,
          });
        } else {
          // Build manifest from database columns
          setManifest({
            name: data.name,
            version: manifestResult.data.manifest_version || "1.0.0",
            displayName: data.name,
            description: data.description,
            main: manifestResult.data.entry_point || "index.tsx",
            permissions: (manifestResult.data.permissions || []) as ModuleManifest["permissions"],
            dependencies: {},
          });
        }
      }
        } catch (phase81cError) {
          // Phase 81C tables may not exist yet - this is expected
          console.log("[ModuleStudio] Phase 81C tables not available:", phase81cError);
        }
    }

    setVersions(versionData);
    setDeployments(deploymentData);
    } catch (error) {
      // Check if component is still mounted and this is the current request
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
        console.log("[ModuleStudio] Error for stale request, ignoring");
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[ModuleStudio] Error loading module:", errorMessage);
      
      // Set error state for better UX
      setLoadError(`Failed to load module: ${errorMessage}`);
    } finally {
      // Only update loading state if this is still the current request
      if (requestId === loadRequestIdRef.current) {
        console.log("[ModuleStudio] Loading complete for requestId:", requestId);
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [moduleId]);

  // Effect to load module data - with proper cleanup
  useEffect(() => {
    // Reset mounted ref on mount
    isMountedRef.current = true;
    
    // Load the module
    loadModule();
    
    // Cleanup on unmount
    return () => {
      console.log("[ModuleStudio] Component unmounting, marking as unmounted");
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, [loadModule]);

  // Phase 81C: Save module files
  const handleSaveFiles = useCallback(async (files: ModuleFile[]) => {
    if (!module?.id) return;
    const supabase = createClient();
    const moduleSourceId = module.id;
    
    // Map UI file types to database file types
    const mapToDbFileType = (uiType: ModuleFile["fileType"]): string => {
      switch (uiType) {
        case "component": return "typescript";
        case "style": return "css";
        case "config": return "json";
        case "asset": return "image";
        default: return "typescript";
      }
    };
    
    for (const file of files) {
      if (file.isNew) {
        await supabase.from("module_files").insert({
          module_source_id: moduleSourceId,
          file_path: file.path,
          content: file.content,
          file_type: mapToDbFileType(file.fileType),
        });
      } else if (file.isModified) {
        await supabase.from("module_files").update({
          content: file.content,
          updated_at: new Date().toISOString(),
        }).eq("id", file.id);
      }
    }

    toast.success("Files saved successfully");
    setHasChanges(true);
    await loadModule();
  }, [module?.id, loadModule]);

  // Phase 81C: File operations
  const handleFileCreate = useCallback(async (path: string, content: string): Promise<ModuleFile> => {
    if (!module?.id) throw new Error("Module not loaded");
    const supabase = createClient();
    const moduleSourceId = module.id;
    const fileType = path.endsWith(".css") || path.endsWith(".scss") ? "css" 
      : path.endsWith(".json") ? "json" 
      : path.endsWith(".ts") || path.endsWith(".tsx") ? "typescript"
      : path.endsWith(".js") || path.endsWith(".jsx") ? "javascript"
      : "typescript";
    
    const { data, error } = await supabase.from("module_files").insert({
      module_source_id: moduleSourceId,
      file_path: path,
      content,
      file_type: fileType,
    }).select().single();

    if (error) throw error;

    // Map back to UI file type
    const uiFileType: ModuleFile["fileType"] = 
      fileType === "css" ? "style" 
      : fileType === "json" ? "config" 
      : "component";

    return {
      id: data.id,
      path: data.file_path,
      content: data.content || "",
      fileType: uiFileType,
    };
  }, [module?.id]);

  const handleFileDelete = useCallback(async (path: string) => {
    if (!module?.id) return;
    const supabase = createClient();
    await supabase.from("module_files").delete().eq("module_source_id", module.id).eq("file_path", path);
  }, [module?.id]);

  const handleFileRename = useCallback(async (oldPath: string, newPath: string) => {
    if (!module?.id) return;
    const supabase = createClient();
    await supabase.from("module_files").update({ file_path: newPath }).eq("module_source_id", module.id).eq("file_path", oldPath);
  }, [module?.id]);

  // Phase 81C: Dependency operations
  const handleAddDependency = useCallback(async (name: string, version: string, type: Dependency["type"]) => {
    if (!module?.id) return;
    const supabase = createClient();
    const moduleSourceId = module.id;
    await supabase.from("module_dependencies").insert({
      module_source_id: moduleSourceId,
      package_name: name,
      version,
      is_dev_dependency: type === "development",
      is_peer_dependency: type === "peer",
      cdn_url: `https://esm.sh/${name}@${version}`,
      cdn_provider: "esm",
    });
    toast.success(`Added ${name}@${version}`);
    await loadModule();
  }, [module?.id, loadModule]);

  const handleRemoveDependency = useCallback(async (name: string) => {
    if (!module?.id) return;
    const supabase = createClient();
    await supabase.from("module_dependencies").delete().eq("module_source_id", module.id).eq("package_name", name);
    toast.success(`Removed ${name}`);
    await loadModule();
  }, [module?.id, loadModule]);

  const handleUpdateDependency = useCallback(async (name: string, version: string) => {
    if (!module?.id) return;
    const supabase = createClient();
    await supabase.from("module_dependencies").update({ 
      version,
      cdn_url: `https://esm.sh/${name}@${version}`,
    }).eq("module_source_id", module.id).eq("package_name", name);
    toast.success(`Updated ${name} to ${version}`);
    await loadModule();
  }, [module?.id, loadModule]);

  // Phase 81C: API Route operations
  const handleSaveRoute = useCallback(async (route: ApiRoute) => {
    if (!module?.id) return;
    const supabase = createClient();
    const moduleSourceId = module.id;
    
    const routeData = {
      module_source_id: moduleSourceId,
      route_path: route.path,
      methods: [route.method],
      description: route.description,
      handler_code: route.handler,
      requires_auth: route.auth?.required ?? true,
      rate_limit_requests: route.rateLimit?.requests ?? 100,
      rate_limit_window_ms: route.rateLimit?.windowMs ?? 60000,
      allowed_origins: route.cors?.origins ?? [],
      is_enabled: route.isActive,
    };

    if (route.id && !route.id.startsWith("new-")) {
      await supabase.from("module_api_routes").update(routeData).eq("id", route.id);
      toast.success("API route updated");
    } else {
      await supabase.from("module_api_routes").insert(routeData);
      toast.success("API route created");
    }
    await loadModule();
  }, [module?.id, loadModule]);

  const handleDeleteRoute = useCallback(async (routeId: string) => {
    const supabase = createClient();
    await supabase.from("module_api_routes").delete().eq("id", routeId);
    toast.success("API route deleted");
    await loadModule();
  }, [loadModule]);

  // Phase 81C: Manifest operations
  const handleSaveManifest = useCallback(async (updatedManifest: ModuleManifest) => {
    if (!module?.id) return;
    const supabase = createClient();
    const moduleSourceId = module.id;
    
    const { data: existing } = await supabase
      .from("module_manifests")
      .select("id")
      .eq("module_source_id", moduleSourceId)
      .maybeSingle();

    // Supabase expects a JSON-compatible type. Convert manifest to plain JSON object
    const rawManifestJson = JSON.parse(JSON.stringify(updatedManifest));
    
    const manifestData = {
      manifest_version: updatedManifest.version,
      entry_point: updatedManifest.main,
      permissions: updatedManifest.permissions,
      raw_manifest: rawManifestJson,
    };

    if (existing) {
      await supabase.from("module_manifests").update({
        ...manifestData,
        updated_at: new Date().toISOString(),
      }).eq("module_source_id", moduleSourceId);
    } else {
      await supabase.from("module_manifests").insert({
        module_source_id: moduleSourceId,
        ...manifestData,
      });
    }
    
    toast.success("Manifest saved");
    setManifest(updatedManifest);
  }, [module?.id]);

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

  // Show error state if loading failed
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-medium">Failed to load module</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {loadError}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadModule()}>
            Try Again
          </Button>
          <Button asChild>
            <Link href="/admin/modules/studio">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Studio
            </Link>
          </Button>
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
            <ModuleImportExport
              module={{
                name,
                slug: module.slug,
                description,
                icon,
                category,
                version: module.latestVersion || "0.0.1",
                renderCode,
                settingsSchema: settingsSchema ? JSON.parse(settingsSchema) : {},
                styles,
                defaultSettings: module.defaultSettings,
                pricingTier,
                dependencies,
              }}
              onImport={(imported: ModulePackage) => {
                // Apply imported module data
                setName(imported.name);
                setDescription(imported.description);
                setIcon(imported.icon);
                setCategory(imported.category);
                setPricingTier(imported.pricingTier || "free");
                setDependencies(imported.dependencies || []);
                setRenderCode(imported.renderCode);
                setStyles(imported.styles);
                setSettingsSchema(JSON.stringify(imported.settingsSchema || {}, null, 2));
                setHasChanges(true);
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import/Export
                </Button>
              }
            />
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/modules/studio/${moduleId}/test`}>
                <FlaskConical className="h-4 w-4 mr-2" />
                Test Module
              </Link>
            </Button>

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

        {/* Right: Advanced Editor with Tabs */}
        <div className="xl:col-span-3">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Tabs value={mainTab} onValueChange={setMainTab} className="flex-1">
                  <TabsList>
                    <TabsTrigger value="code" className="gap-2">
                      <Code className="h-4 w-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="files" className="gap-2">
                      <Files className="h-4 w-4" />
                      Files
                      {moduleFiles.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {moduleFiles.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="dependencies" className="gap-2">
                      <Package className="h-4 w-4" />
                      Dependencies
                      {moduleDeps.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {moduleDeps.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="api" className="gap-2">
                      <Route className="h-4 w-4" />
                      API Routes
                      {apiRoutes.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {apiRoutes.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="manifest" className="gap-2">
                      <FileJson className="h-4 w-4" />
                      Manifest
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditorMode(editorMode === "simple" ? "advanced" : "simple")}
                      >
                        {editorMode === "simple" ? "Switch to Advanced" : "Switch to Simple"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {editorMode === "simple" 
                        ? "Advanced mode supports multi-file projects" 
                        : "Simple mode for single-file modules"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              {/* Code Tab - Simple Editor */}
              {mainTab === "code" && (
                <div className="h-full">
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
              )}

              {/* Files Tab - Multi-File Editor */}
              {mainTab === "files" && (
                <div className="h-full p-4">
                  <MultiFileEditor
                    moduleId={moduleId}
                    files={moduleFiles}
                    onSave={handleSaveFiles}
                    onFileCreate={handleFileCreate}
                    onFileDelete={handleFileDelete}
                    onFileRename={handleFileRename}
                    className="h-full"
                  />
                </div>
              )}

              {/* Dependencies Tab */}
              {mainTab === "dependencies" && (
                <div className="h-full overflow-auto p-4">
                  <DependencyManager
                    moduleId={moduleId}
                    dependencies={moduleDeps}
                    onAdd={handleAddDependency}
                    onRemove={handleRemoveDependency}
                    onUpdate={handleUpdateDependency}
                    className="h-full"
                  />
                </div>
              )}

              {/* API Routes Tab */}
              {mainTab === "api" && (
                <div className="h-full overflow-auto p-4">
                  <ApiRouteBuilder
                    moduleId={moduleId}
                    routes={apiRoutes}
                    onSave={handleSaveRoute}
                    onDelete={handleDeleteRoute}
                    className="h-full"
                  />
                </div>
              )}

              {/* Manifest Tab */}
              {mainTab === "manifest" && (
                <div className="h-full overflow-auto p-4">
                  <ManifestEditor
                    manifest={manifest || {
                      name: module.slug,
                      version: module.latestVersion || "0.0.1",
                      displayName: name,
                      description: description,
                      main: "index.tsx",
                      permissions: [],
                      dependencies: {},
                    }}
                    onChange={(updatedManifest) => {
                      setManifest(updatedManifest);
                      setHasChanges(true);
                    }}
                    onSave={async () => {
                      if (manifest) {
                        await handleSaveManifest(manifest);
                      }
                    }}
                    className="h-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
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
