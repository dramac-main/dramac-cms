"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Package,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Check,
  Info,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface Dependency {
  name: string;
  version: string;
  type: "production" | "development" | "peer";
  status?: "installed" | "pending" | "error";
  latestVersion?: string;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  downloads?: number;
  repository?: string;
}

interface DependencyManagerProps {
  moduleId: string;
  dependencies: Dependency[];
  onAdd: (name: string, version: string, type: Dependency["type"]) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
  onUpdate: (name: string, version: string) => Promise<void>;
  onSearch?: (query: string) => Promise<PackageSearchResult[]>;
  allowedPackages?: string[];
  className?: string;
  readOnly?: boolean;
}

// ============================================================================
// CDN Configuration
// ============================================================================

const CDN_PROVIDERS = {
  esm: {
    name: "esm.sh",
    url: "https://esm.sh",
    format: (name: string, version: string) => `https://esm.sh/${name}@${version}`,
  },
  unpkg: {
    name: "unpkg",
    url: "https://unpkg.com",
    format: (name: string, version: string) => `https://unpkg.com/${name}@${version}`,
  },
  jsdelivr: {
    name: "jsDelivr",
    url: "https://cdn.jsdelivr.net",
    format: (name: string, version: string) => `https://cdn.jsdelivr.net/npm/${name}@${version}`,
  },
  skypack: {
    name: "Skypack",
    url: "https://cdn.skypack.dev",
    format: (name: string, version: string) => `https://cdn.skypack.dev/${name}@${version}`,
  },
};

// Popular packages for quick add
const POPULAR_PACKAGES = [
  { name: "lodash", description: "Utility library" },
  { name: "date-fns", description: "Date utilities" },
  { name: "axios", description: "HTTP client" },
  { name: "uuid", description: "UUID generation" },
  { name: "zod", description: "Schema validation" },
  { name: "clsx", description: "Class names utility" },
  { name: "framer-motion", description: "Animation library" },
  { name: "@tanstack/react-query", description: "Data fetching" },
];

// ============================================================================
// Dependency Manager Component
// ============================================================================

export function DependencyManager({
  moduleId,
  dependencies,
  onAdd,
  onRemove,
  onUpdate,
  onSearch,
  allowedPackages,
  className,
  readOnly = false,
}: DependencyManagerProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PackageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCdn, setSelectedCdn] = useState<keyof typeof CDN_PROVIDERS>("esm");
  const [addDialog, setAddDialog] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: "", version: "latest", type: "production" as Dependency["type"] });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search packages
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      if (onSearch) {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } else {
        // Default: search npm registry
        const response = await fetch(
          `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=10`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(
            data.objects.map((obj: { package: { name: string; version: string; description: string; links?: { repository?: string } } }) => ({
              name: obj.package.name,
              version: obj.package.version,
              description: obj.package.description || "",
              repository: obj.package.links?.repository,
            }))
          );
        }
      }
    } catch {
      setError("Failed to search packages");
    }

    setSearching(false);
  }, [searchQuery, onSearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Add dependency
  const handleAdd = useCallback(async () => {
    if (!newPackage.name.trim()) return;

    // Check if allowed
    if (allowedPackages && !allowedPackages.includes(newPackage.name)) {
      setError(`Package "${newPackage.name}" is not in the allowed list`);
      return;
    }

    setPendingAction(newPackage.name);
    setError(null);

    try {
      await onAdd(newPackage.name, newPackage.version, newPackage.type);
      setNewPackage({ name: "", version: "latest", type: "production" });
      setAddDialog(false);
    } catch {
      setError(`Failed to add ${newPackage.name}`);
    }

    setPendingAction(null);
  }, [newPackage, onAdd, allowedPackages]);

  // Remove dependency
  const handleRemove = useCallback(async (name: string) => {
    setPendingAction(name);
    setError(null);

    try {
      await onRemove(name);
    } catch {
      setError(`Failed to remove ${name}`);
    }

    setPendingAction(null);
  }, [onRemove]);

  // Update dependency
  const handleUpdate = useCallback(async (name: string, version: string) => {
    setPendingAction(name);
    setError(null);

    try {
      await onUpdate(name, version);
    } catch {
      setError(`Failed to update ${name}`);
    }

    setPendingAction(null);
  }, [onUpdate]);

  // Quick add from popular packages
  const handleQuickAdd = useCallback((pkg: typeof POPULAR_PACKAGES[0]) => {
    setNewPackage({ name: pkg.name, version: "latest", type: "production" });
    setAddDialog(true);
  }, []);

  // Generate import map preview
  const importMapPreview = dependencies.reduce((acc, dep) => {
    const cdn = CDN_PROVIDERS[selectedCdn];
    acc[dep.name] = cdn.format(dep.name, dep.version);
    return acc;
  }, {} as Record<string, string>);

  // Check if package is allowed
  const isPackageAllowed = (name: string) => {
    if (!allowedPackages) return true;
    return allowedPackages.includes(name);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dependencies
            </CardTitle>
            <CardDescription className="mt-1">
              Manage NPM packages loaded via CDN
            </CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => setAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Package
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 space-y-4">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* CDN Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">CDN Provider:</Label>
          <Select value={selectedCdn} onValueChange={(v) => setSelectedCdn(v as keyof typeof CDN_PROVIDERS)}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CDN_PROVIDERS).map(([key, provider]) => (
                <SelectItem key={key} value={key}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Packages are loaded at runtime via CDN. esm.sh is recommended
                  for best compatibility with ES modules.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator />

        {/* Dependencies Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No dependencies added yet
                  </TableCell>
                </TableRow>
              ) : (
                dependencies.map((dep) => (
                  <TableRow key={dep.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dep.name}</span>
                        {dep.status === "pending" && (
                          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                        {dep.status === "error" && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                        {dep.status === "installed" && (
                          <Check className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {dep.version}
                        </Badge>
                        {dep.latestVersion && dep.latestVersion !== dep.version && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => !readOnly && handleUpdate(dep.name, dep.latestVersion!)}>
                                  {dep.latestVersion} available
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Click to update</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dep.type === "production" ? "default" : dep.type === "development" ? "secondary" : "outline"}>
                        {dep.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`https://www.npmjs.com/package/${dep.name}`, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View on npm</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!readOnly && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemove(dep.name)}
                                  disabled={pendingAction === dep.name}
                                >
                                  {pendingAction === dep.name ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Popular Packages */}
        {!readOnly && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Add Popular Packages</Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PACKAGES.filter(
                  (pkg) =>
                    !dependencies.some((d) => d.name === pkg.name) &&
                    isPackageAllowed(pkg.name)
                ).map((pkg) => (
                  <TooltipProvider key={pkg.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAdd(pkg)}
                          className="h-7 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {pkg.name}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{pkg.description}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Import Map Preview */}
        {dependencies.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Generated Import Map</Label>
              <div className="bg-muted rounded-md p-3 overflow-x-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify({ imports: importMapPreview }, null, 2)}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Add Package Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Search for an NPM package or enter the name directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search Packages</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search npm packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searching && (
                  <RefreshCw className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {searchResults.map((result) => {
                    const allowed = isPackageAllowed(result.name);
                    const alreadyAdded = dependencies.some((d) => d.name === result.name);

                    return (
                      <div
                        key={result.name}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer",
                          (!allowed || alreadyAdded) && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (allowed && !alreadyAdded) {
                            setNewPackage({ ...newPackage, name: result.name, version: result.version });
                            setSearchQuery("");
                            setSearchResults([]);
                          }
                        }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.name}</span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {result.version}
                            </Badge>
                            {!allowed && (
                              <Badge variant="destructive" className="text-xs">
                                Not allowed
                              </Badge>
                            )}
                            {alreadyAdded && (
                              <Badge variant="secondary" className="text-xs">
                                Already added
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {result.description}
                          </p>
                        </div>
                        {result.repository && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(result.repository, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            <Separator />

            {/* Manual Entry */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  placeholder="e.g., lodash"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageVersion">Version</Label>
                <Input
                  id="packageVersion"
                  placeholder="latest"
                  value={newPackage.version}
                  onChange={(e) => setNewPackage({ ...newPackage, version: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dependency Type</Label>
              <Select
                value={newPackage.type}
                onValueChange={(v) => setNewPackage({ ...newPackage, type: v as Dependency["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="peer">Peer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newPackage.name.trim() || pendingAction !== null}
            >
              {pendingAction ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default DependencyManager;
