"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Check, AlertCircle, Code, Palette, Settings } from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
        Loading editor...
      </div>
    ),
  }
);

interface ModuleCodeEditorProps {
  renderCode: string;
  styles: string;
  settingsSchema: string;
  onRenderCodeChange: (code: string) => void;
  onStylesChange: (styles: string) => void;
  onSettingsSchemaChange: (schema: string) => void;
  onValidate?: () => Promise<{ valid: boolean; errors: string[] }>;
  readOnly?: boolean;
}

export function ModuleCodeEditor({
  renderCode,
  styles,
  settingsSchema,
  onRenderCodeChange,
  onStylesChange,
  onSettingsSchemaChange,
  onValidate,
  readOnly = false,
}: ModuleCodeEditorProps) {
  const [activeTab, setActiveTab] = useState("render");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);

  const handleValidate = useCallback(async () => {
    if (!onValidate) {
      // Default validation
      const errors: string[] = [];
      
      // Validate render code
      if (!renderCode?.trim()) {
        errors.push("Render code is required");
      } else {
        // Check for basic structure
        if (!renderCode.includes("export")) {
          errors.push("Module should export a component");
        }
        
        // Basic bracket matching
        const openBraces = (renderCode.match(/{/g) || []).length;
        const closeBraces = (renderCode.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push("Mismatched curly braces in render code");
        }
      }
      
      // Validate JSON schema
      if (settingsSchema?.trim()) {
        try {
          JSON.parse(settingsSchema);
        } catch {
          errors.push("Invalid JSON in settings schema");
        }
      }
      
      setValidationResult({
        valid: errors.length === 0,
        errors,
      });
      return;
    }

    setValidating(true);
    try {
      const result = await onValidate();
      setValidationResult(result);
    } catch {
      setValidationResult({
        valid: false,
        errors: ["Validation failed"],
      });
    }
    setValidating(false);
  }, [onValidate, renderCode, settingsSchema]);

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on" as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    readOnly,
    wordWrap: "on" as const,
    folding: true,
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "render":
        return <Code className="h-4 w-4" />;
      case "styles":
        return <Palette className="h-4 w-4" />;
      case "schema":
        return <Settings className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Module Code
          </CardTitle>
          <div className="flex items-center gap-2">
            {validationResult && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  validationResult.valid
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {validationResult.valid ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {validationResult.valid
                  ? "Valid"
                  : `${validationResult.errors.length} error${validationResult.errors.length !== 1 ? "s" : ""}`}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Validate
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full justify-start rounded-none border-b px-2 h-12 flex-shrink-0">
            <TabsTrigger value="render" className="gap-2">
              {getTabIcon("render")}
              Render (TSX)
            </TabsTrigger>
            <TabsTrigger value="styles" className="gap-2">
              {getTabIcon("styles")}
              Styles (CSS)
            </TabsTrigger>
            <TabsTrigger value="schema" className="gap-2">
              {getTabIcon("schema")}
              Settings Schema
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 relative">
            <TabsContent 
              value="render" 
              className="absolute inset-0 m-0 data-[state=inactive]:hidden"
            >
              <Editor
                height="100%"
                language="typescript"
                theme="vs-dark"
                value={renderCode}
                onChange={(value) => onRenderCodeChange(value || "")}
                options={editorOptions}
              />
            </TabsContent>

            <TabsContent 
              value="styles" 
              className="absolute inset-0 m-0 data-[state=inactive]:hidden"
            >
              <Editor
                height="100%"
                language="css"
                theme="vs-dark"
                value={styles}
                onChange={(value) => onStylesChange(value || "")}
                options={editorOptions}
              />
            </TabsContent>

            <TabsContent 
              value="schema" 
              className="absolute inset-0 m-0 data-[state=inactive]:hidden"
            >
              <Editor
                height="100%"
                language="json"
                theme="vs-dark"
                value={settingsSchema}
                onChange={(value) => onSettingsSchemaChange(value || "")}
                options={editorOptions}
              />
            </TabsContent>
          </div>
        </Tabs>

        {validationResult && !validationResult.valid && (
          <div className="bg-destructive/10 border-t border-destructive p-3 flex-shrink-0">
            <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Validation Errors
            </h4>
            <ul className="text-sm text-destructive space-y-1">
              {validationResult.errors.map((error, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive/70">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
