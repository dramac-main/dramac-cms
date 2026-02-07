/**
 * AI Website Designer - FULLY WORKING Page
 * 
 * End-to-end AI-powered website generation using the real WebsiteDesignerEngine.
 * Uses Anthropic Claude to generate complete websites from a simple prompt.
 * 
 * Features:
 * - Real AI generation via /api/ai/website-designer
 * - Live preview using actual Studio components via StudioRenderer
 * - Device preview (mobile/tablet/desktop)
 * - Refinement and iteration
 * - Save to database on approval
 */

"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import { Sparkles, ArrowLeft, Loader2, RefreshCw, Check, X, Monitor, Tablet, Smartphone, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// Animation imports available for future use
// import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Import the real Studio Renderer
import { StudioRenderer } from "@/lib/studio/engine/renderer";
import { convertPageToStudioFormat } from "@/lib/ai/website-designer/converter";

import type { WebsiteDesignerOutput } from "@/lib/ai/website-designer/types";
import type { StudioPageData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface AIDesignerPageProps {
  params: Promise<{ siteId: string }>;
}

type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceConfig {
  width: number;
  height: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEVICES: Record<DeviceType, DeviceConfig> = {
  mobile: { width: 375, height: 667, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, height: 1024, label: "Tablet", icon: Tablet },
  desktop: { width: 1280, height: 800, label: "Desktop", icon: Monitor },
};

const STYLE_OPTIONS = [
  { value: "minimal", label: "Minimal & Clean" },
  { value: "bold", label: "Bold & Modern" },
  { value: "elegant", label: "Elegant & Sophisticated" },
  { value: "playful", label: "Playful & Fun" },
  { value: "corporate", label: "Corporate & Professional" },
  { value: "creative", label: "Creative & Artistic" },
];

const COLOR_OPTIONS = [
  { value: "brand", label: "Match Brand Colors" },
  { value: "warm", label: "Warm Tones" },
  { value: "cool", label: "Cool Tones" },
  { value: "monochrome", label: "Monochrome" },
  { value: "vibrant", label: "Vibrant & Colorful" },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Time estimates for each stage (in seconds) - used for reference
const _STAGE_TIME_ESTIMATES: Record<string, number> = {
  "initializing": 2,
  "building-context": 5,
  "analyzing-prompt": 15,
  "creating-architecture": 20,
  "generating-pages": 45, // per page, but we'll multiply
  "generating-shared-elements": 15,
  "finalizing": 5,
};

export default function AIDesignerPage({ params }: AIDesignerPageProps) {
  const { siteId } = use(params);
  const router = useRouter();
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("minimal");
  const [colorPreference, setColorPreference] = useState<string>("brand");
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [_currentStage, setCurrentStage] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotalTime, setEstimatedTotalTime] = useState(90); // Default 90 seconds
  const [generationError, setGenerationError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Results state
  const [output, setOutput] = useState<WebsiteDesignerOutput | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [studioDataMap, setStudioDataMap] = useState<Map<string, StudioPageData>>(new Map());
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Timer for elapsed time
  useEffect(() => {
    if (isGenerating) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isGenerating]);

  // Convert generated pages to Studio format when output changes
  useEffect(() => {
    if (output?.pages) {
      const map = new Map<string, StudioPageData>();
      for (const page of output.pages) {
        const studioData = convertPageToStudioFormat(page);
        map.set(page.slug, studioData);
      }
      setStudioDataMap(map);
    }
  }, [output]);

  // Get current page data
  const currentPage = output?.pages[selectedPageIndex];
  const currentStudioData = currentPage ? studioDataMap.get(currentPage.slug) : null;
  const deviceConfig = DEVICES[device];

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what kind of website you want");
      return;
    }

    if (prompt.length < 10) {
      toast.error("Please provide a more detailed description (at least 10 characters)");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setElapsedTime(0);
    setProgressMessage("Connecting to AI service...");
    setCurrentStage("initializing");
    setGenerationError(null);
    setOutput(null);
    setEstimatedTotalTime(90); // Reset estimate

    try {
      // Use the streaming endpoint for real-time progress
      const response = await fetch("/api/ai/website-designer/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          prompt,
          preferences: {
            style,
            colorPreference,
            layoutDensity: "balanced",
            animationLevel: "subtle",
          },
        }),
      });

      if (!response.ok) {
        // Try to parse error response
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        } else {
          // Handle timeout or HTML error responses
          if (response.status === 524) {
            throw new Error("Request timed out. The AI is working hard - please try again with a simpler prompt.");
          }
          throw new Error(`Server error: ${response.status}. Please try again.`);
        }
      }

      // Check if response is SSE
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/event-stream")) {
        // Fallback to regular JSON response
        const result = await response.json() as WebsiteDesignerOutput;
        if (!result.success) {
          throw new Error(result.error || "Generation failed");
        }
        setProgress(100);
        setProgressMessage("Website generated successfully!");
        setOutput(result);
        setSelectedPageIndex(0);
        toast.success(`Generated ${result.pages.length} pages!`);
        return;
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // Event type is tracked on separate line, used for SSE protocol
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different event types based on data structure
              if (data.stage) {
                // Progress event
                setCurrentStage(data.stage);
                setProgressMessage(data.message || `${data.stage}...`);
                
                // Calculate progress based on stage
                const stages = ["initializing", "building-context", "analyzing-prompt", "creating-architecture", "generating-pages", "generating-shared-elements", "finalizing"];
                const stageIndex = stages.indexOf(data.stage);
                if (stageIndex >= 0) {
                  const baseProgress = (stageIndex / stages.length) * 100;
                  const stageProgress = (data.pagesComplete || 0) / Math.max(data.pagesTotal || 1, 1) * (100 / stages.length);
                  setProgress(Math.min(baseProgress + stageProgress, 95));
                }

                // Update time estimate based on pages
                if (data.pagesTotal && data.pagesTotal > 0) {
                  const newEstimate = 30 + (data.pagesTotal * 20); // 30s base + 20s per page
                  setEstimatedTotalTime(newEstimate);
                }
              } else if (data.success !== undefined) {
                // Complete event
                if (data.success) {
                  setProgress(100);
                  setProgressMessage("Website generated successfully!");
                  setOutput(data as WebsiteDesignerOutput);
                  setSelectedPageIndex(0);
                  toast.success(`Generated ${data.pages?.length || 0} pages!`);
                } else {
                  throw new Error(data.error || "Generation failed");
                }
              } else if (data.message && !data.stage) {
                // Error or info event
                if (data.error) {
                  throw new Error(data.message);
                }
                setProgressMessage(data.message);
              }
            } catch (_parseError) {
              console.warn("[AI Designer] Failed to parse SSE data:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("[AI Designer] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate website";
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [siteId, prompt, style, colorPreference]);

  const handleSaveAndApply = useCallback(async () => {
    if (!output || studioDataMap.size === 0) {
      toast.error("No website to save");
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    let errorCount = 0;

    try {
      // Save each page
      for (const page of output.pages) {
        const studioData = studioDataMap.get(page.slug);
        if (!studioData) {
          console.warn(`[AI Designer] No studio data for page ${page.slug}`);
          continue;
        }

        // Create page in database
        const createResponse = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            name: page.name || page.title,
            slug: page.slug,
            isHomepage: page.isHomepage,
            description: page.description,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          console.error(`[AI Designer] Failed to create page ${page.slug}:`, errorData);
          errorCount++;
          continue;
        }

        const { pageId, exists } = await createResponse.json();
        
        if (exists) {
          console.log(`[AI Designer] Page ${page.slug} already exists, updating content...`);
        }

        // Save page content
        const contentResponse = await fetch(`/api/pages/${pageId}/content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: studioData }),
        });

        if (!contentResponse.ok) {
          const errorData = await contentResponse.json().catch(() => ({}));
          console.error(`[AI Designer] Failed to save content for page ${page.slug}:`, errorData);
          errorCount++;
        } else {
          savedCount++;
          console.log(`[AI Designer] Saved page ${page.slug} (${pageId})`);
        }
      }

      if (savedCount > 0) {
        toast.success(`Website saved! ${savedCount} pages created successfully.`);
        // Redirect to the studio for the homepage
        router.push(`/dashboard/sites/${siteId}/pages`);
      } else if (errorCount > 0) {
        toast.error(`Failed to save pages. ${errorCount} errors occurred.`);
      } else {
        toast.warning("No pages were saved. Please try generating again.");
      }
    } catch (error) {
      console.error("[AI Designer] Save error:", error);
      toast.error("Failed to save website. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [output, studioDataMap, siteId, router]);

  const handleDiscard = useCallback(() => {
    setOutput(null);
    setStudioDataMap(new Map());
    setSelectedPageIndex(0);
    setProgress(0);
    toast.info("Preview discarded");
  }, []);

  // =============================================================================
  // RENDER - INPUT FORM
  // =============================================================================

  if (!output) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex h-16 items-center gap-4">
            <Link href={`/dashboard/sites/${siteId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Site
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Website Designer
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-12">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight">
                Build Your Website with AI
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Describe what you want, and our AI will create a complete, 
                professional website in seconds.
              </p>
            </div>

            {/* Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Describe Your Website</CardTitle>
                <CardDescription>
                  Tell us about your business and the website you need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">What kind of website do you want?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Example: I need a professional website for my restaurant in Lusaka called 'Café Zambezi'. We serve traditional Zambian cuisine and want to showcase our menu, accept reservations, and highlight our location. Include a hero section, menu gallery, about section, testimonials, and contact form."
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific! Include your business type, key features, and sections you want.
                  </p>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="style">Design Style</Label>
                    <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                      <SelectTrigger id="style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color Palette</Label>
                    <Select value={colorPreference} onValueChange={setColorPreference} disabled={isGenerating}>
                      <SelectTrigger id="color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="space-y-4 py-6 px-4 bg-muted/30 rounded-lg border">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                    
                    {/* Status Message */}
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">{progressMessage}</span>
                    </div>
                    
                    {/* Time Info */}
                    <div className="flex justify-between items-center text-sm border-t pt-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Elapsed: <span className="font-mono text-foreground">{formatTime(elapsedTime)}</span></span>
                      </div>
                      <div className="text-muted-foreground">
                        Est. total: <span className="font-mono text-foreground">~{formatTime(estimatedTotalTime)}</span>
                      </div>
                    </div>
                    
                    {/* AI Working Message */}
                    <p className="text-xs text-center text-muted-foreground">
                      AI is designing your website. This typically takes 1-2 minutes depending on complexity.
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {generationError && !isGenerating && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-destructive">Generation Failed</p>
                        <p className="text-sm text-muted-foreground">{generationError}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Try again with a simpler prompt, or contact support if the issue persists.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  className="w-full gap-2" 
                  size="lg"
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Your Website...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Website
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-semibold text-sm mb-1">Be Specific</div>
                <div className="text-xs text-muted-foreground">
                  Include your business name, location, and services
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-semibold text-sm mb-1">List Features</div>
                <div className="text-xs text-muted-foreground">
                  Tell us what sections you need (hero, about, contact)
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="font-semibold text-sm mb-1">Review & Edit</div>
                <div className="text-xs text-muted-foreground">
                  Preview your site and make changes in the editor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER - PREVIEW MODE
  // =============================================================================

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="h-14 border-b bg-white dark:bg-gray-800 flex items-center justify-between px-4 shrink-0">
        {/* Page Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {output.pages.map((page, index) => (
            <Button
              key={page.slug}
              variant={selectedPageIndex === index ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedPageIndex(index)}
              className="whitespace-nowrap"
            >
              {page.title}
              {page.isHomepage && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Home
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Device Selector */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50">
          {(Object.entries(DEVICES) as [DeviceType, DeviceConfig][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={key}
                variant={device === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setDevice(key)}
                className="h-8 w-8 p-0"
                title={config.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Discard
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAndApply}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Apply & Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 p-6">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: deviceConfig.width,
              height: deviceConfig.height,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {/* 
              CRITICAL: Force light mode for preview canvas
              This creates an isolated context that prevents dark mode inheritance 
            */}
            <div 
              className="h-full overflow-auto light" 
              style={{ 
                colorScheme: "light",
                backgroundColor: "#ffffff",
                color: "#000000",
              }} 
              data-theme="light"
              data-mode="light"
            >
              {/* Additional wrapper to ensure CSS isolation */}
              <div className="studio-preview-wrapper" style={{
                // Reset all colors to ensure no dark mode leakage
                "--background": "0 0% 100%",
                "--foreground": "222.2 84% 4.9%",
                "--card": "0 0% 100%",
                "--card-foreground": "222.2 84% 4.9%",
                "--popover": "0 0% 100%",
                "--popover-foreground": "222.2 84% 4.9%",
                "--primary": "221.2 83.2% 53.3%",
                "--primary-foreground": "210 40% 98%",
                "--secondary": "210 40% 96.1%",
                "--secondary-foreground": "222.2 47.4% 11.2%",
                "--muted": "210 40% 96.1%",
                "--muted-foreground": "215.4 16.3% 46.9%",
                "--accent": "210 40% 96.1%",
                "--accent-foreground": "222.2 47.4% 11.2%",
                "--destructive": "0 84.2% 60.2%",
                "--destructive-foreground": "210 40% 98%",
                "--border": "214.3 31.8% 91.4%",
                "--input": "214.3 31.8% 91.4%",
                "--ring": "221.2 83.2% 53.3%",
              } as React.CSSProperties}>
                {currentStudioData ? (
                  <StudioRenderer
                    data={currentStudioData}
                    siteId={siteId}
                    pageId={currentPage?.slug}
                    className="bg-white"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 bg-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Page Info */}
        <div className="w-80 ml-6 shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Page Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                {currentPage && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Page Title</Label>
                      <p className="font-medium">{currentPage.title}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <p className="font-mono text-sm">{currentPage.slug}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Components</Label>
                      <div className="mt-2 space-y-2">
                        {currentPage.components.map((comp, i) => (
                          <div 
                            key={comp.id || i}
                            className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                          >
                            <Badge variant="outline" className="text-xs">
                              {comp.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t bg-white dark:bg-gray-800 flex items-center justify-between px-4 text-xs text-muted-foreground shrink-0">
        <span>
          {output.pages.length} pages • {output.pages.reduce((acc, p) => acc + p.components.length, 0)} components
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Ready to apply
        </span>
      </div>
    </div>
  );
}
