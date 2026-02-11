"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, RefreshCw, Settings, AlertTriangle, CircleCheck, CircleX, Copy, Download, Code, Sliders, Eye, icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getModuleSource, type ModuleSource } from "@/lib/modules/module-builder";
import { resolveIconName } from "@/lib/utils/icon-map";

interface TestResult {
  type: "info" | "warn" | "error" | "success";
  message: string;
  timestamp: Date;
  details?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface SettingField {
  type: string;
  label: string;
  default?: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

export default function ModuleTestPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<ModuleSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [testSettings, setTestSettings] = useState<string>("{}");
  const [parsedSettings, setParsedSettings] = useState<Record<string, unknown>>({});
  const [settingsMode, setSettingsMode] = useState<"visual" | "json">("visual");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [autoPreview, setAutoPreview] = useState(true);

  // Sync parsed settings with JSON string
  const updateSettingsFromParsed = useCallback((newSettings: Record<string, unknown>) => {
    setParsedSettings(newSettings);
    setTestSettings(JSON.stringify(newSettings, null, 2));
    // Auto-update preview if enabled
    if (autoPreview && module) {
      const html = generatePreviewHtml(module, newSettings);
      setPreviewHtml(html);
    }
  }, [autoPreview, module]);

  const updateSettingsFromJson = useCallback((json: string) => {
    setTestSettings(json);
    try {
      const parsed = JSON.parse(json);
      setParsedSettings(parsed);
      // Auto-update preview if enabled
      if (autoPreview && module) {
        const html = generatePreviewHtml(module, parsed);
        setPreviewHtml(html);
      }
    } catch {
      // Invalid JSON, don't update parsed
    }
  }, [autoPreview, module]);

  useEffect(() => {
    loadModule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  async function loadModule() {
    setLoading(true);
    const data = await getModuleSource(moduleId);
    if (data) {
      setModule(data);
      // Initialize test settings with module's default settings
      const defaultSettings = data.defaultSettings || {};
      setTestSettings(JSON.stringify(defaultSettings, null, 2));
      setParsedSettings(defaultSettings as Record<string, unknown>);
      // Auto-validate on load
      validateModule(data);
      // Generate initial preview
      if (autoPreview) {
        const html = generatePreviewHtml(data, defaultSettings as Record<string, unknown>);
        setPreviewHtml(html);
      }
    }
    setLoading(false);
  }

  // Render a setting field based on its type
  function renderSettingField(key: string, schema: SettingField) {
    const value = parsedSettings[key] ?? schema.default ?? "";
    
    const updateValue = (newValue: unknown) => {
      updateSettingsFromParsed({ ...parsedSettings, [key]: newValue });
    };

    switch (schema.type) {
      case "text":
      case "string":
        return (
          <Input
            value={String(value)}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={schema.placeholder || schema.default?.toString()}
          />
        );
        
      case "textarea":
        return (
          <Textarea
            value={String(value)}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={schema.placeholder || schema.default?.toString()}
            rows={3}
          />
        );
        
      case "number":
        return (
          <Input
            type="number"
            value={Number(value)}
            onChange={(e) => updateValue(Number(e.target.value))}
            min={schema.min}
            max={schema.max}
          />
        );
        
      case "color":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={String(value) || "#000000"}
              onChange={(e) => updateValue(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={String(value)}
              onChange={(e) => updateValue(e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono text-sm"
            />
          </div>
        );
        
      case "boolean":
      case "switch":
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateValue(checked)}
          />
        );
        
      case "select":
        return (
          <Select value={String(value)} onValueChange={(v) => updateValue(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {schema.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case "url":
      case "image":
        return (
          <Input
            type="url"
            value={String(value)}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={schema.type === "image" ? "https://example.com/image.jpg" : "https://example.com"}
          />
        );
        
      default:
        return (
          <Input
            value={String(value)}
            onChange={(e) => updateValue(e.target.value)}
          />
        );
    }
  }

  function validateModule(mod: ModuleSource): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!mod.name) errors.push("Module name is required");
    if (!mod.slug) errors.push("Module slug is required");
    if (!mod.renderCode?.trim()) errors.push("Render code is empty");

    // Check render code structure
    const code = mod.renderCode || "";
    
    // Must have an export
    if (!code.includes("export")) {
      errors.push("Module must export a component (missing 'export' keyword)");
    }

    // Check for common React patterns
    if (!code.includes("function") && !code.includes("=>") && !code.includes("class")) {
      errors.push("No component function or class found");
    }

    // Check for settings usage if schema exists
    const schemaKeys = Object.keys(mod.settingsSchema || {});
    if (schemaKeys.length > 0 && !code.includes("settings") && !code.includes("props")) {
      warnings.push("Settings schema defined but 'settings' not referenced in code");
    }

    // Bracket matching
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }

    // Check for JSX
    if (!code.includes("<") || !code.includes("/>") && !code.includes("</")) {
      warnings.push("No JSX detected - is this a valid React component?");
    }

    // Check dependencies
    if (mod.dependencies?.length) {
      warnings.push(`Module has ${mod.dependencies.length} dependencies that must be available at runtime`);
    }

    // Validate settings schema JSON
    try {
      if (mod.settingsSchema && typeof mod.settingsSchema !== "object") {
        errors.push("Settings schema must be a valid JSON object");
      }
    } catch {
      errors.push("Invalid settings schema JSON");
    }

    const result = { valid: errors.length === 0, errors, warnings };
    setValidation(result);
    return result;
  }

  function addResult(type: TestResult["type"], message: string, details?: string) {
    setTestResults((prev) => [
      { type, message, timestamp: new Date(), details },
      ...prev,
    ]);
  }

  async function runTests() {
    if (!module) return;

    setIsRunning(true);
    setTestResults([]);
    addResult("info", "Starting module tests...");

    // Step 1: Validate structure
    addResult("info", "Validating module structure...");
    const validationResult = validateModule(module);
    
    if (!validationResult.valid) {
      validationResult.errors.forEach((err) => addResult("error", err));
      addResult("error", "Validation failed - cannot proceed with tests");
      setIsRunning(false);
      return;
    }
    
    validationResult.warnings.forEach((warn) => addResult("warn", warn));
    addResult("success", "Structure validation passed");

    // Step 2: Parse test settings
    addResult("info", "Parsing test settings...");
    let settings: Record<string, unknown>;
    try {
      settings = JSON.parse(testSettings);
      addResult("success", `Parsed settings: ${Object.keys(settings).length} properties`);
    } catch (e) {
      addResult("error", "Failed to parse test settings JSON", String(e));
      setIsRunning(false);
      return;
    }

    // Step 3: Generate preview HTML
    addResult("info", "Generating sandbox preview...");
    try {
      const html = generatePreviewHtml(module, settings);
      setPreviewHtml(html);
      addResult("success", "Preview HTML generated");
    } catch (e) {
      addResult("error", "Failed to generate preview", String(e));
    }

    // Step 4: Check for runtime requirements
    addResult("info", "Checking runtime requirements...");
    const runtimeChecks = checkRuntimeRequirements(module.renderCode || "");
    runtimeChecks.forEach((check) => {
      if (check.ok) {
        addResult("success", check.message);
      } else {
        addResult("warn", check.message);
      }
    });

    // Complete
    addResult("success", "All tests completed!");
    setIsRunning(false);
  }

  function checkRuntimeRequirements(code: string): Array<{ ok: boolean; message: string }> {
    const checks: Array<{ ok: boolean; message: string }> = [];

    // Check for React hooks usage
    const hooks = ["useState", "useEffect", "useCallback", "useMemo", "useRef"];
    hooks.forEach((hook) => {
      if (code.includes(hook)) {
        checks.push({ ok: true, message: `Uses ${hook} - React hooks available` });
      }
    });

    // Check for external dependencies
    const imports = code.match(/import .+ from ['"][^'"]+['"]/g) || [];
    if (imports.length > 0) {
      imports.forEach((imp) => {
        const from = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (from && !from.startsWith(".") && !from.startsWith("@/")) {
          checks.push({ 
            ok: false, 
            message: `External import: ${from} - ensure this is available in runtime` 
          });
        }
      });
    }

    // Check for fetch/API calls
    if (code.includes("fetch(") || code.includes("axios")) {
      checks.push({ ok: true, message: "Makes API calls - ensure CORS is configured" });
    }

    // Check for localStorage/sessionStorage
    if (code.includes("localStorage") || code.includes("sessionStorage")) {
      checks.push({ ok: true, message: "Uses browser storage" });
    }

    return checks;
  }

  function generatePreviewHtml(mod: ModuleSource, settings: Record<string, unknown>): string {
    // Transform the module code to work in browser context
    // Convert "export default function X" to "function X" and capture it
    let processedCode = mod.renderCode || "";
    
    // Extract the function name from export default
    const exportDefaultFnMatch = processedCode.match(/export\s+default\s+function\s+(\w+)/);
    const exportDefaultConstMatch = processedCode.match(/export\s+default\s+(\w+)/);
    
    let componentName = "ModuleComponent";
    
    if (exportDefaultFnMatch) {
      // export default function ComponentName -> function ComponentName
      componentName = exportDefaultFnMatch[1];
      processedCode = processedCode.replace(/export\s+default\s+function/, "function");
    } else if (exportDefaultConstMatch && !processedCode.includes("export default function")) {
      // export default ComponentName at the end - remove it
      componentName = exportDefaultConstMatch[1];
      processedCode = processedCode.replace(/export\s+default\s+\w+;?\s*$/, "");
    } else if (processedCode.includes("export default")) {
      // export default () => or export default { - wrap it
      processedCode = processedCode.replace(
        /export\s+default\s+/,
        "const ModuleComponent = "
      );
    }
    
    // Also handle named exports used in the code
    processedCode = processedCode.replace(/export\s+(?!default)/g, "");
    
    // Escape backticks and ${} in the code for template literal safety
    const escapedCode = processedCode
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
    
    const escapedStyles = (mod.styles || "")
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Preview: ${mod.name}</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      padding: 20px; 
      background: #f9fafb;
      min-height: 100vh;
    }
    .preview-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .error { 
      color: #dc2626; 
      background: #fef2f2; 
      padding: 16px; 
      border-radius: 8px; 
      margin: 16px 0;
      border: 1px solid #fecaca;
    }
    .error code {
      display: block;
      margin-top: 8px;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }
    .loading { 
      color: #6b7280; 
      text-align: center; 
      padding: 40px;
    }
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    ${escapedStyles}
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading module preview...</p>
    </div>
  </div>
  
  <script type="text/babel" data-presets="react">
    // Make React hooks available globally
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, useReducer } = React;
    
    // Module settings passed from test configuration
    const moduleSettings = ${JSON.stringify(settings)};
    
    try {
      // ============ MODULE CODE START ============
      ${escapedCode}
      // ============ MODULE CODE END ============
      
      // Determine which component to render
      const ComponentToRender = typeof ${componentName} !== 'undefined' 
        ? ${componentName}
        : typeof ModuleComponent !== 'undefined'
        ? ModuleComponent
        : () => (
            <div className="error">
              <strong>Component Not Found</strong>
              <p>Could not find a component to render. Make sure your module exports a default function.</p>
            </div>
          );
      
      // Wrapper component to catch render errors
      function PreviewWrapper() {
        const [hasError, setHasError] = React.useState(false);
        const [errorMsg, setErrorMsg] = React.useState('');
        
        if (hasError) {
          return (
            <div className="error">
              <strong>Render Error</strong>
              <p>{errorMsg}</p>
            </div>
          );
        }
        
        try {
          return (
            <div className="preview-container">
              <ComponentToRender settings={moduleSettings} />
            </div>
          );
        } catch (err) {
          return (
            <div className="error">
              <strong>Component Error</strong>
              <p>{err.message}</p>
              <code>{err.stack}</code>
            </div>
          );
        }
      }
      
      // Render the module
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<PreviewWrapper />);
      
    } catch (error) {
      document.getElementById('root').innerHTML = 
        '<div class="error">' +
        '<strong>JavaScript Error</strong>' +
        '<p>' + error.message + '</p>' +
        '<code>' + (error.stack || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>' +
        '</div>';
      console.error('Module Preview Error:', error);
    }
  <\/script>
</body>
</html>`;
  }

  function copyPreviewHtml() {
    navigator.clipboard.writeText(previewHtml);
    toast.success("Preview HTML copied to clipboard");
  }

  function downloadModule() {
    if (!module) return;
    
    const modulePackage = {
      name: module.name,
      slug: module.slug,
      description: module.description,
      icon: module.icon,
      category: module.category,
      version: module.latestVersion || "0.0.1",
      renderCode: module.renderCode,
      settingsSchema: module.settingsSchema,
      styles: module.styles,
      defaultSettings: module.defaultSettings,
      pricingTier: module.pricingTier,
      dependencies: [],
    };

    const blob = new Blob([JSON.stringify(modulePackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.slug}-module.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Module exported as JSON");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Module Not Found</AlertTitle>
          <AlertDescription>
            The module &quot;{moduleId}&quot; could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">{(() => { const iconName = resolveIconName(module.icon || "Package"); const Ic = (icons as Record<string, React.ComponentType<{className?: string}>>)[iconName]; return Ic ? <Ic className="h-6 w-6" /> : null; })()}</span>
              Test: {module.name}
            </h1>
            <p className="text-muted-foreground">
              Sandbox testing environment for module development
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={module.status === "testing" ? "default" : "secondary"}>
            {module.status}
          </Badge>
          <Badge variant="outline">v{module.latestVersion || "0.0.1"}</Badge>
          <Button variant="outline" size="sm" onClick={downloadModule}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={runTests} disabled={isRunning}>
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Tests
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {validation && (
        <Alert variant={validation.valid ? "default" : "destructive"}>
          {validation.valid ? (
            <CircleCheck className="h-4 w-4" />
          ) : (
            <CircleX className="h-4 w-4" />
          )}
          <AlertTitle>
            {validation.valid ? "Module Valid" : "Validation Errors"}
          </AlertTitle>
          <AlertDescription>
            {validation.errors.length > 0 && (
              <ul className="list-disc list-inside mt-2">
                {validation.errors.map((err, i) => (
                  <li key={i} className="text-destructive">{err}</li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="list-disc list-inside mt-2">
                {validation.warnings.map((warn, i) => (
                  <li key={i} className="text-yellow-600">{warn}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Test Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Test Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the settings to test how your module renders
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="auto-preview"
                      checked={autoPreview}
                      onCheckedChange={setAutoPreview}
                    />
                    <Label htmlFor="auto-preview" className="text-sm">
                      <Eye className="h-4 w-4 inline mr-1" />
                      Live Preview
                    </Label>
                  </div>
                  <div className="flex border rounded-md">
                    <Button
                      variant={settingsMode === "visual" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSettingsMode("visual")}
                      className="rounded-r-none"
                    >
                      <Sliders className="h-4 w-4 mr-1" />
                      Visual
                    </Button>
                    <Button
                      variant={settingsMode === "json" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSettingsMode("json")}
                      className="rounded-l-none"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      JSON
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsMode === "visual" ? (
                // Visual Settings Editor
                <div className="space-y-4">
                  {module.settingsSchema && Object.keys(module.settingsSchema as Record<string, SettingField>).length > 0 ? (
                    Object.entries(module.settingsSchema as Record<string, SettingField>).map(([key, schema]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="flex items-center gap-2">
                          {schema.label || key}
                          {schema.type === "color" && (
                            <span
                              className="w-4 h-4 rounded border inline-block"
                              style={{ backgroundColor: String(parsedSettings[key] || schema.default || "#000") }}
                            />
                          )}
                        </Label>
                        {renderSettingField(key, schema)}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sliders className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No settings schema defined</p>
                      <p className="text-sm mt-1">
                        Add a settings schema to your module to enable visual editing
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSettingsMode("json")}
                        className="mt-2"
                      >
                        Switch to JSON mode
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // JSON Settings Editor
                <div className="space-y-4">
                  <div>
                    <Label>Settings JSON</Label>
                    <Textarea
                      value={testSettings}
                      onChange={(e) => updateSettingsFromJson(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                      placeholder="{}"
                    />
                  </div>
                  {module.settingsSchema && Object.keys(module.settingsSchema).length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Expected Schema:</Label>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-[200px]">
                        {JSON.stringify(module.settingsSchema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const defaults = module.defaultSettings || {};
                    updateSettingsFromParsed(defaults as Record<string, unknown>);
                    toast.success("Reset to default settings");
                  }}
                >
                  Reset to Defaults
                </Button>
                {!autoPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const settings = JSON.parse(testSettings);
                        const html = generatePreviewHtml(module, settings);
                        setPreviewHtml(html);
                        toast.success("Preview updated");
                      } catch {
                        toast.error("Invalid JSON in settings");
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Update Preview
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                {testResults.length} result(s) from test run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Click &quot;Run Tests&quot; to start testing
                  </p>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((result, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-sm ${
                          result.type === "error"
                            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : result.type === "warn"
                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : result.type === "success"
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {result.type === "error" && <CircleX className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          {result.type === "warn" && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          {result.type === "success" && <CircleCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1">
                            <p>{result.message}</p>
                            {result.details && (
                              <pre className="text-xs mt-1 opacity-70">{result.details}</pre>
                            )}
                          </div>
                          <span className="text-xs opacity-50">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    Sandboxed module preview with test settings
                  </CardDescription>
                </div>
                {previewHtml && (
                  <Button variant="outline" size="sm" onClick={copyPreviewHtml}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {previewHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[500px] bg-white"
                    sandbox="allow-scripts"
                    title="Module Preview"
                  />
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run tests to see a live preview</p>
                    <p className="text-sm mt-2">
                      The module will render in a sandboxed iframe
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Module Info */}
      <Tabs defaultValue="code">
        <TabsList>
          <TabsTrigger value="code">Render Code</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
          <TabsTrigger value="schema">Settings Schema</TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                {module.renderCode || "// No render code"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="styles" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                {module.styles || "/* No custom styles */"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schema" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                {JSON.stringify(module.settingsSchema, null, 2) || "{}"}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
