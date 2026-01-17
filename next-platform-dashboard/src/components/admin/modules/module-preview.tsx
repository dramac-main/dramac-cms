"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Maximize2, Minimize2, Smartphone, Tablet, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ModulePreviewProps {
  renderCode: string;
  styles: string;
  settings: Record<string, unknown>;
  moduleName?: string;
}

type DeviceType = "mobile" | "tablet" | "desktop";

const deviceWidths: Record<DeviceType, string> = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
};

export function ModulePreview({
  renderCode,
  styles,
  settings,
  moduleName = "Module",
}: ModulePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${moduleName}</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      background: #ffffff;
    }
    .module-error {
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
    }
    .module-error pre {
      margin-top: 8px;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .module-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    ${styles || ""}
  </style>
</head>
<body>
  <div id="module-root">
    <div class="module-loading">
      <span>Loading preview...</span>
    </div>
  </div>
  
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    
    // Module settings passed from parent
    const moduleSettings = ${JSON.stringify(settings)};
    
    // Error boundary wrapper
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      
      render() {
        if (this.state.hasError) {
          return (
            <div className="module-error">
              <strong>Render Error</strong>
              <pre>{this.state.error?.message || 'Unknown error'}</pre>
            </div>
          );
        }
        return this.props.children;
      }
    }
    
    try {
      // Inject module code
      ${renderCode || `
        function Module({ settings }) {
          return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              <p>No render code provided</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Add component code in the editor
              </p>
            </div>
          );
        }
        export default Module;
      `}
      
      // Find the exported component
      const ModuleComponent = typeof Module !== 'undefined' 
        ? Module 
        : (() => <div className="module-error">No 'Module' export found</div>);
      
      // Render with error boundary
      const root = ReactDOM.createRoot(document.getElementById('module-root'));
      root.render(
        <ErrorBoundary>
          <ModuleComponent settings={moduleSettings} />
        </ErrorBoundary>
      );
    } catch (err) {
      document.getElementById('module-root').innerHTML = 
        '<div class="module-error"><strong>Compilation Error</strong><pre>' + 
        (err.message || err) + '</pre></div>';
      
      // Send error to parent
      window.parent.postMessage({ type: 'module-error', error: err.message }, '*');
    }
  </script>
</body>
</html>`;

      setPreviewHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setIsLoading(false);
    }
  }, [renderCode, styles, settings, moduleName]);

  // Regenerate preview when inputs change
  useEffect(() => {
    const timer = setTimeout(generatePreview, 500); // Debounce
    return () => clearTimeout(timer);
  }, [generatePreview]);

  // Listen for error messages from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "module-error") {
        setError(event.data.error);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background p-4"
    : "";

  return (
    <Card className={containerClasses}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Live Preview</CardTitle>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={device}
              onValueChange={(v) => v && setDevice(v as DeviceType)}
              size="sm"
            >
              <ToggleGroupItem value="mobile" aria-label="Mobile view">
                <Smartphone className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label="Tablet view">
                <Tablet className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="desktop" aria-label="Desktop view">
                <Monitor className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={generatePreview}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <div
          className="border rounded-lg bg-white overflow-hidden transition-all duration-300 mx-auto"
          style={{
            width: deviceWidths[device],
            maxWidth: "100%",
          }}
        >
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className={`w-full bg-white ${isFullscreen ? "h-[calc(100vh-150px)]" : "h-[400px]"}`}
              sandbox="allow-scripts"
              title="Module Preview"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              {isLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                "Preview will appear here"
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
