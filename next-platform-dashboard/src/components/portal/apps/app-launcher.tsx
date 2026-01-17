"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppIframeSandbox } from "./app-iframe-sandbox";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  slug: string;
  runtime_type?: "iframe" | "embedded" | "external" | "native";
  app_url?: string | null;
  external_url?: string | null;
  entry_component?: string | null;
}

interface Installation {
  id: string;
  settings: Record<string, unknown>;
  custom_name?: string | null;
}

interface AppLauncherProps {
  module: Module;
  installation: Installation;
  clientId: string;
  agencyId?: string;
}

export function AppLauncher({ module, installation, clientId, agencyId }: AppLauncherProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  // Determine how to render the module
  const runtimeType = module.runtime_type || "iframe";

  useEffect(() => {
    // Simulate initialization time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading {module.name}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load app</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Iframe-based module
  if (runtimeType === "iframe" && module.app_url) {
    return (
      <AppIframeSandbox
        moduleId={module.id}
        appUrl={module.app_url}
        clientId={clientId}
        agencyId={agencyId}
        settings={installation.settings}
      />
    );
  }

  // External URL module (opens in iframe or redirects)
  if (runtimeType === "external" && module.external_url) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">{module.icon || "🔗"}</span>
          <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
          <p className="text-muted-foreground mb-4">
            This app opens in a new window
          </p>
          <a
            href={module.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Open {module.name}
          </a>
        </div>
      </div>
    );
  }

  // Native embedded component
  if (runtimeType === "native" || runtimeType === "embedded") {
    // Dynamic component loading would go here based on entry_component
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">{module.icon || "📦"}</span>
          <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
          <p className="text-muted-foreground">
            Native component: {module.entry_component || "Not configured"}
          </p>
        </div>
      </div>
    );
  }

  // Fallback - no runtime configured (show module info)
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">{module.icon || "📦"}</span>
        <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
        <p className="text-muted-foreground">{module.description}</p>
        <p className="text-sm text-muted-foreground mt-4">
          This module is being configured by your agency.
        </p>
      </div>
    </div>
  );
}
