"use client";

import { useState, useCallback } from "react";
import { 
  Rocket, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Server,
  Globe,
  GitBranch,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deployModule } from "@/lib/modules/module-deployer";

interface ModuleDeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  moduleName: string;
  currentVersion: string;
  onSuccess?: (version: string) => void;
}

type Environment = "staging" | "production";
type VersionType = "patch" | "minor" | "major";

export function ModuleDeployDialog({
  open,
  onOpenChange,
  moduleId,
  moduleName,
  currentVersion,
  onSuccess,
}: ModuleDeployDialogProps) {
  const [environment, setEnvironment] = useState<Environment>("staging");
  const [versionType, setVersionType] = useState<VersionType>("patch");
  const [changelog, setChangelog] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    version?: string;
    error?: string;
  } | null>(null);

  const getNextVersion = useCallback(() => {
    const parts = currentVersion.split(".").map(Number);
    const [major, minor, patch] = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
    
    switch (versionType) {
      case "major":
        return `${major + 1}.0.0`;
      case "minor":
        return `${major}.${minor + 1}.0`;
      case "patch":
        return `${major}.${minor}.${patch + 1}`;
    }
  }, [currentVersion, versionType]);

  const handleDeploy = async () => {
    if (!changelog.trim()) {
      setResult({ success: false, error: "Please provide a changelog describing the changes" });
      return;
    }

    setDeploying(true);
    setResult(null);

    try {
      const deployResult = await deployModule(
        moduleId,
        environment,
        versionType,
        changelog.trim()
      );

      setResult(deployResult);

      if (deployResult.success && onSuccess) {
        onSuccess(deployResult.version!);
        // Reset form after successful deployment
        setTimeout(() => {
          setChangelog("");
          setResult(null);
        }, 2000);
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : "Deployment failed" 
      });
    }

    setDeploying(false);
  };

  const handleClose = () => {
    if (!deploying) {
      onOpenChange(false);
      // Reset state after close
      setTimeout(() => {
        setResult(null);
        setChangelog("");
        setEnvironment("staging");
        setVersionType("patch");
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy {moduleName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Current: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{currentVersion}</code>
            <span className="text-muted-foreground">→</span>
            Next: <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">{getNextVersion()}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Environment Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Deploy to</Label>
            <RadioGroup
              value={environment}
              onValueChange={(v) => setEnvironment(v as Environment)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="env-staging"
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  environment === "staging"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="staging" id="env-staging" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span className="font-medium">Staging</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Test before going live
                  </span>
                </div>
              </Label>

              <Label
                htmlFor="env-production"
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                  environment === "production"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="production" id="env-production" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Production</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Live to all users
                  </span>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Version Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Version bump type</Label>
            <RadioGroup
              value={versionType}
              onValueChange={(v) => setVersionType(v as VersionType)}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="ver-patch"
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer text-center transition-all ${
                  versionType === "patch" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="patch" id="ver-patch" className="sr-only" />
                <span className="font-medium">Patch</span>
                <span className="text-xs text-muted-foreground">Bug fixes</span>
              </Label>

              <Label
                htmlFor="ver-minor"
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer text-center transition-all ${
                  versionType === "minor" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="minor" id="ver-minor" className="sr-only" />
                <span className="font-medium">Minor</span>
                <span className="text-xs text-muted-foreground">New features</span>
              </Label>

              <Label
                htmlFor="ver-major"
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer text-center transition-all ${
                  versionType === "major" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="major" id="ver-major" className="sr-only" />
                <span className="font-medium">Major</span>
                <span className="text-xs text-muted-foreground">Breaking</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Changelog */}
          <div className="space-y-2">
            <Label htmlFor="changelog" className="text-sm font-medium">
              Changelog <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="Describe what changed in this version...

Examples:
- Fixed bug with form validation
- Added new chart component
- Updated styling for mobile"
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {changelog.length}/1000 characters
            </p>
          </div>

          {/* Production Warning */}
          {environment === "production" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Production Deployment</AlertTitle>
              <AlertDescription>
                This will deploy to production and affect all sites currently using this module.
                Make sure you've tested in staging first.
              </AlertDescription>
            </Alert>
          )}

          {/* Major Version Warning */}
          {versionType === "major" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Breaking Change</AlertTitle>
              <AlertDescription>
                Major versions indicate breaking changes. Users may need to update their configurations.
              </AlertDescription>
            </Alert>
          )}

          {/* Result Message */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? "Deployment Successful" : "Deployment Failed"}
              </AlertTitle>
              <AlertDescription>
                {result.success
                  ? `Version ${result.version} has been deployed to ${environment}`
                  : result.error || "An error occurred during deployment"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deploying}
          >
            {result?.success ? "Close" : "Cancel"}
          </Button>
          {!result?.success && (
            <Button 
              onClick={handleDeploy} 
              disabled={deploying || !changelog.trim()}
              className={environment === "production" ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {deploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy to {environment}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
