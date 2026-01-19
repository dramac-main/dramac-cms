"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Route,
  Plus,
  Trash2,
  Edit,
  Copy,
  Play,
  RefreshCw,
  AlertCircle,
  Check,
  Code,
  Globe,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface ApiRoute {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  description?: string;
  handler: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cors?: {
    enabled: boolean;
    origins?: string[];
  };
  auth?: {
    required: boolean;
    scopes?: string[];
  };
  requestSchema?: string;
  responseSchema?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiRouteBuilderProps {
  moduleId: string;
  routes: ApiRoute[];
  onSave: (route: ApiRoute) => Promise<void>;
  onDelete: (routeId: string) => Promise<void>;
  onTest?: (route: ApiRoute, payload?: unknown) => Promise<{ status: number; body: unknown }>;
  className?: string;
  readOnly?: boolean;
}

// ============================================================================
// Default Handler Templates
// ============================================================================

const HANDLER_TEMPLATES: Record<string, string> = {
  basic: `// Basic handler
export default async function handler(req, ctx) {
  return {
    status: 200,
    body: { message: "Hello from module API!" }
  };
}`,
  crud_get: `// GET handler - retrieve data
export default async function handler(req, ctx) {
  const { db, params, query } = ctx;
  
  const id = params.id || query.id;
  
  if (id) {
    const data = await db.get("item:" + id);
    if (!data) {
      return { status: 404, body: { error: "Not found" } };
    }
    return { status: 200, body: data };
  }
  
  // List all items
  const items = await db.list({ prefix: "item:" });
  return { status: 200, body: { items } };
}`,
  crud_post: `// POST handler - create data
export default async function handler(req, ctx) {
  const { db, body } = ctx;
  
  if (!body || typeof body !== 'object') {
    return { status: 400, body: { error: "Invalid request body" } };
  }
  
  const id = crypto.randomUUID();
  const item = {
    id,
    ...body,
    createdAt: new Date().toISOString()
  };
  
  await db.set("item:" + id, item);
  
  return { status: 201, body: item };
}`,
  crud_put: `// PUT handler - update data
export default async function handler(req, ctx) {
  const { db, params, body } = ctx;
  
  const id = params.id;
  if (!id) {
    return { status: 400, body: { error: "ID required" } };
  }
  
  const existing = await db.get("item:" + id);
  if (!existing) {
    return { status: 404, body: { error: "Not found" } };
  }
  
  const updated = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString()
  };
  
  await db.set("item:" + id, updated);
  
  return { status: 200, body: updated };
}`,
  crud_delete: `// DELETE handler - remove data
export default async function handler(req, ctx) {
  const { db, params } = ctx;
  
  const id = params.id;
  if (!id) {
    return { status: 400, body: { error: "ID required" } };
  }
  
  const existing = await db.get("item:" + id);
  if (!existing) {
    return { status: 404, body: { error: "Not found" } };
  }
  
  await db.delete("item:" + id);
  
  return { status: 204 };
}`,
  webhook: `// Webhook handler
export default async function handler(req, ctx) {
  const { body, headers, events } = ctx;
  
  // Verify webhook signature if needed
  const signature = headers['x-webhook-signature'];
  
  // Process the webhook payload
  console.log('Webhook received:', body);
  
  // Emit an event for other modules
  await events.emit('webhook:received', { payload: body });
  
  return { status: 200, body: { received: true } };
}`,
};

// ============================================================================
// HTTP Method Colors
// ============================================================================

const METHOD_COLORS: Record<ApiRoute["method"], string> = {
  GET: "bg-green-500/10 text-green-600 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  PATCH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

// ============================================================================
// API Route Builder Component
// ============================================================================

export function ApiRouteBuilder({
  moduleId,
  routes,
  onSave,
  onDelete,
  onTest,
  className,
  readOnly = false,
}: ApiRouteBuilderProps) {
  // State
  const [editDialog, setEditDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<ApiRoute | null>(null);
  const [testPayload, setTestPayload] = useState("");
  const [testResult, setTestResult] = useState<{ status: number; body: unknown } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create new route
  const handleNewRoute = useCallback(() => {
    setCurrentRoute({
      id: "",
      path: "/",
      method: "GET",
      handler: HANDLER_TEMPLATES.basic,
      isActive: true,
    });
    setEditDialog(true);
  }, []);

  // Edit route
  const handleEditRoute = useCallback((route: ApiRoute) => {
    setCurrentRoute({ ...route });
    setEditDialog(true);
  }, []);

  // Save route
  const handleSaveRoute = useCallback(async () => {
    if (!currentRoute) return;

    // Validate
    if (!currentRoute.path.startsWith("/")) {
      setError("Path must start with /");
      return;
    }

    if (!currentRoute.handler.trim()) {
      setError("Handler code is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(currentRoute);
      setEditDialog(false);
      setCurrentRoute(null);
    } catch {
      setError("Failed to save route");
    }

    setSaving(false);
  }, [currentRoute, onSave]);

  // Delete route
  const handleDeleteRoute = useCallback(async (routeId: string) => {
    setSaving(true);
    setError(null);

    try {
      await onDelete(routeId);
    } catch {
      setError("Failed to delete route");
    }

    setSaving(false);
  }, [onDelete]);

  // Test route
  const handleTestRoute = useCallback((route: ApiRoute) => {
    setCurrentRoute(route);
    setTestPayload(route.method !== "GET" ? '{\n  \n}' : "");
    setTestResult(null);
    setTestDialog(true);
  }, []);

  // Execute test
  const executeTest = useCallback(async () => {
    if (!currentRoute || !onTest) return;

    setTesting(true);
    setError(null);
    setTestResult(null);

    try {
      let payload;
      if (testPayload.trim() && currentRoute.method !== "GET") {
        payload = JSON.parse(testPayload);
      }

      const result = await onTest(currentRoute, payload);
      setTestResult(result);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON in test payload");
      } else {
        setError("Test execution failed");
      }
    }

    setTesting(false);
  }, [currentRoute, testPayload, onTest]);

  // Duplicate route
  const handleDuplicate = useCallback((route: ApiRoute) => {
    setCurrentRoute({
      ...route,
      id: "",
      path: route.path + "-copy",
    });
    setEditDialog(true);
  }, []);

  // Apply template
  const applyTemplate = useCallback((templateKey: string) => {
    if (!currentRoute) return;
    setCurrentRoute({
      ...currentRoute,
      handler: HANDLER_TEMPLATES[templateKey] || HANDLER_TEMPLATES.basic,
    });
  }, [currentRoute]);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              API Routes
            </CardTitle>
            <CardDescription className="mt-1">
              Define custom API endpoints for your module
            </CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={handleNewRoute}>
              <Plus className="h-4 w-4 mr-1" />
              Add Route
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        )}

        {/* Routes List */}
        {routes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API routes defined</p>
            {!readOnly && (
              <Button variant="outline" className="mt-4" onClick={handleNewRoute}>
                <Plus className="h-4 w-4 mr-1" />
                Create your first route
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {routes.map((route) => (
              <div
                key={route.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors",
                  !route.isActive && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn("font-mono", METHOD_COLORS[route.method])}>
                    {route.method}
                  </Badge>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">/api/modules/{moduleId}{route.path}</code>
                      {!route.isActive && <Badge variant="secondary">Disabled</Badge>}
                    </div>
                    {route.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{route.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Feature badges */}
                  <div className="flex items-center gap-1">
                    {route.auth?.required && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Auth required</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {route.rateLimit && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Rate limited: {route.rateLimit.requests} req/{route.rateLimit.windowMs / 1000}s
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {route.cors?.enabled && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>CORS enabled</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <Separator orientation="vertical" className="h-4" />

                  {/* Actions */}
                  {onTest && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleTestRoute(route)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {!readOnly && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicate(route)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditRoute(route)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentRoute?.id ? "Edit API Route" : "Create API Route"}
            </DialogTitle>
            <DialogDescription>
              Define the endpoint path, HTTP method, and handler function.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={currentRoute?.method || "GET"}
                    onValueChange={(v) =>
                      setCurrentRoute((prev) =>
                        prev ? { ...prev, method: v as ApiRoute["method"] } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((method) => (
                        <SelectItem key={method} value={method}>
                          <Badge variant="outline" className={cn("font-mono", METHOD_COLORS[method])}>
                            {method}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Path</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      /api/modules/{moduleId}
                    </span>
                    <Input
                      placeholder="/"
                      value={currentRoute?.path || "/"}
                      onChange={(e) =>
                        setCurrentRoute((prev) =>
                          prev ? { ...prev, path: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use :param for dynamic segments, e.g., /items/:id
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What does this endpoint do?"
                  value={currentRoute?.description || ""}
                  onChange={(e) =>
                    setCurrentRoute((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>

              <Separator />

              {/* Handler Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Handler Function</Label>
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger className="w-[180px] h-8">
                      <Code className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Use template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Handler</SelectItem>
                      <SelectItem value="crud_get">CRUD: GET</SelectItem>
                      <SelectItem value="crud_post">CRUD: POST</SelectItem>
                      <SelectItem value="crud_put">CRUD: PUT</SelectItem>
                      <SelectItem value="crud_delete">CRUD: DELETE</SelectItem>
                      <SelectItem value="webhook">Webhook Handler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  className="font-mono text-sm h-[300px]"
                  value={currentRoute?.handler || ""}
                  onChange={(e) =>
                    setCurrentRoute((prev) =>
                      prev ? { ...prev, handler: e.target.value } : null
                    )
                  }
                />
              </div>

              <Separator />

              {/* Advanced Options */}
              <Accordion type="single" collapsible>
                <AccordionItem value="auth">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Authentication
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require Authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Users must be logged in to access this endpoint
                          </p>
                        </div>
                        <Switch
                          checked={currentRoute?.auth?.required || false}
                          onCheckedChange={(checked) =>
                            setCurrentRoute((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    auth: { ...prev.auth, required: checked },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rateLimit">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Rate Limiting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>Max Requests</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={currentRoute?.rateLimit?.requests || ""}
                          onChange={(e) =>
                            setCurrentRoute((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rateLimit: {
                                      requests: parseInt(e.target.value) || 100,
                                      windowMs: prev.rateLimit?.windowMs || 60000,
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window (ms)</Label>
                        <Input
                          type="number"
                          placeholder="60000"
                          value={currentRoute?.rateLimit?.windowMs || ""}
                          onChange={(e) =>
                            setCurrentRoute((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rateLimit: {
                                      requests: prev.rateLimit?.requests || 100,
                                      windowMs: parseInt(e.target.value) || 60000,
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cors">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      CORS Settings
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable CORS</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow cross-origin requests to this endpoint
                          </p>
                        </div>
                        <Switch
                          checked={currentRoute?.cors?.enabled || false}
                          onCheckedChange={(checked) =>
                            setCurrentRoute((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    cors: { ...prev.cors, enabled: checked },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      {currentRoute?.cors?.enabled && (
                        <div className="space-y-2">
                          <Label>Allowed Origins (comma-separated)</Label>
                          <Input
                            placeholder="*, https://example.com"
                            value={currentRoute?.cors?.origins?.join(", ") || "*"}
                            onChange={(e) =>
                              setCurrentRoute((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      cors: {
                                        ...prev.cors,
                                        enabled: true,
                                        origins: e.target.value
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean),
                                      },
                                    }
                                  : null
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable to temporarily turn off this route
                  </p>
                </div>
                <Switch
                  checked={currentRoute?.isActive ?? true}
                  onCheckedChange={(checked) =>
                    setCurrentRoute((prev) =>
                      prev ? { ...prev, isActive: checked } : null
                    )
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoute} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test API Route</DialogTitle>
            <DialogDescription>
              Send a test request to your endpoint.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Endpoint Info */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Badge variant="outline" className={cn("font-mono", METHOD_COLORS[currentRoute?.method || "GET"])}>
                {currentRoute?.method}
              </Badge>
              <code className="text-sm flex-1 truncate">
                /api/modules/{moduleId}{currentRoute?.path}
              </code>
            </div>

            {/* Request Payload */}
            {currentRoute?.method !== "GET" && (
              <div className="space-y-2">
                <Label>Request Body (JSON)</Label>
                <Textarea
                  className="font-mono text-sm h-[150px]"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='{ "key": "value" }'
                />
              </div>
            )}

            {/* Test Result */}
            {testResult && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Response
                  <Badge variant={testResult.status < 400 ? "default" : "destructive"}>
                    {testResult.status}
                  </Badge>
                </Label>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {JSON.stringify(testResult.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>
              Close
            </Button>
            <Button onClick={executeTest} disabled={testing}>
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ApiRouteBuilder;
