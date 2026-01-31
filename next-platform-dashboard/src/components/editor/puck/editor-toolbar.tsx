/**
 * Editor Toolbar
 * 
 * Enhanced toolbar for the Puck editor with zoom controls,
 * viewport switching, device preview, and action buttons.
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Eye,
  Edit2,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoreHorizontal,
  ExternalLink,
  ChevronDown,
  Loader2,
  Check,
  Keyboard,
  Sparkles,
  Wand2,
  BarChart3,
  LayoutTemplate,
  History,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyCombination } from "./keyboard-shortcuts";

// Types
export type DeviceType = "mobile" | "tablet" | "desktop";
export type EditorMode = "edit" | "preview";

interface EditorToolbarProps {
  // Mode
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  
  // Save state
  hasChanges: boolean;
  isSaving: boolean;
  lastSaved?: Date | null;
  onSave: () => void;
  
  // History
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Device/Viewport
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  
  // Zoom
  zoom: number;
  onZoomChange: (zoom: number) => void;
  
  // AI Features
  onShowAI?: () => void;
  onShowGeneration?: () => void;
  onShowOptimization?: () => void;
  onShowTemplates?: () => void;
  
  // Other actions
  onShowShortcuts?: () => void;
  onExternalPreview?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  
  // Custom content
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  
  className?: string;
}

/**
 * Toolbar button component
 */
function ToolbarButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  active,
  variant = "ghost",
  className,
}: {
  icon: React.ReactNode;
  label?: string;
  shortcut?: string[];
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "ghost" | "default" | "primary";
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "relative flex items-center justify-center rounded-md transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "ghost" && [
          "p-2 hover:bg-muted",
          active && "bg-muted text-primary",
        ],
        variant === "default" && [
          "px-3 py-1.5 border",
          active ? "bg-muted border-border" : "border-transparent hover:bg-muted",
        ],
        variant === "primary" && [
          "px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:bg-muted disabled:text-muted-foreground",
        ],
        className
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label && <span className="text-sm font-medium">{label}</span>}
      </span>
      {shortcut && (
        <span className="hidden lg:flex ml-2">
          <KeyCombination keys={shortcut} size="sm" />
        </span>
      )}
    </button>
  );
}

/**
 * Toolbar divider
 */
function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

/**
 * Device selector
 */
function DeviceSelector({
  device,
  onChange,
}: {
  device: DeviceType;
  onChange: (device: DeviceType) => void;
}) {
  const devices: { value: DeviceType; icon: React.ReactNode; label: string }[] = [
    { value: "mobile", icon: <Smartphone className="w-4 h-4" />, label: "Mobile" },
    { value: "tablet", icon: <Tablet className="w-4 h-4" />, label: "Tablet" },
    { value: "desktop", icon: <Monitor className="w-4 h-4" />, label: "Desktop" },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 bg-muted/50 rounded-lg">
      {devices.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          title={d.label}
          className={cn(
            "p-1.5 rounded transition-all",
            device === d.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {d.icon}
        </button>
      ))}
    </div>
  );
}

/**
 * Zoom control
 */
function ZoomControl({
  zoom,
  onChange,
}: {
  zoom: number;
  onChange: (zoom: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const presets = [50, 75, 100, 125, 150, 200];
  
  const handleZoomIn = () => {
    const newZoom = Math.min(200, zoom + 10);
    onChange(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(25, zoom - 10);
    onChange(newZoom);
  };
  
  const handleFit = () => {
    onChange(100);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleZoomOut}
        className="p-1.5 hover:bg-muted rounded transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded transition-colors min-w-[60px] justify-center"
        >
          <span className="text-sm font-medium">{zoom}%</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 py-1 bg-popover border rounded-md shadow-lg z-50 min-w-[100px]"
              >
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      onChange(preset);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center justify-between",
                      zoom === preset && "text-primary"
                    )}
                  >
                    <span>{preset}%</span>
                    {zoom === preset && <Check className="w-3 h-3" />}
                  </button>
                ))}
                <div className="border-t my-1" />
                <button
                  onClick={() => {
                    handleFit();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Maximize2 className="w-3 h-3" />
                  Fit to screen
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      <button
        onClick={handleZoomIn}
        className="p-1.5 hover:bg-muted rounded transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Save status indicator
 */
function SaveStatus({
  hasChanges,
  isSaving,
  lastSaved,
}: {
  hasChanges: boolean;
  isSaving: boolean;
  lastSaved?: Date | null;
}) {
  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving...
      </span>
    );
  }

  if (hasChanges) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Unsaved changes
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="w-3 h-3 text-green-500" />
        Saved {formatTime(lastSaved)}
      </span>
    );
  }

  return null;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Main Editor Toolbar Component
 */
export function EditorToolbar({
  mode,
  onModeChange,
  hasChanges,
  isSaving,
  lastSaved,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  device,
  onDeviceChange,
  zoom,
  onZoomChange,
  onShowAI,
  onShowGeneration,
  onShowOptimization,
  onShowTemplates,
  onShowShortcuts,
  onExternalPreview,
  onRefresh,
  onExport,
  onSettings,
  leftContent,
  rightContent,
  className,
}: EditorToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className={cn(
      "h-14 border-b bg-card flex items-center justify-between px-4 shrink-0",
      className
    )}>
      {/* Left section */}
      <div className="flex items-center gap-3">
        {leftContent}
        
        {/* Save status */}
        <SaveStatus 
          hasChanges={hasChanges} 
          isSaving={isSaving} 
          lastSaved={lastSaved} 
        />
      </div>

      {/* Center section - Mode toggle and viewport */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Undo2 className="w-4 h-4" />}
            label="Undo"
            shortcut={["Ctrl", "Z"]}
            onClick={onUndo}
            disabled={!canUndo}
          />
          <ToolbarButton
            icon={<Redo2 className="w-4 h-4" />}
            label="Redo"
            shortcut={["Ctrl", "Shift", "Z"]}
            onClick={onRedo}
            disabled={!canRedo}
          />
        </div>

        <ToolbarDivider />

        {/* Device selector */}
        <DeviceSelector device={device} onChange={onDeviceChange} />

        <ToolbarDivider />

        {/* Zoom */}
        <ZoomControl zoom={zoom} onChange={onZoomChange} />

        <ToolbarDivider />

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => onModeChange("edit")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all",
              mode === "edit"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onModeChange("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all",
              mode === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* AI Tools */}
        <div className="flex items-center gap-0.5 mr-1">
          {onShowAI && (
            <ToolbarButton
              icon={<Sparkles className="w-4 h-4" />}
              label="AI Assistant"
              onClick={onShowAI}
              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
            />
          )}
          {onShowGeneration && (
            <ToolbarButton
              icon={<Wand2 className="w-4 h-4" />}
              label="Generate Page"
              onClick={onShowGeneration}
              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
            />
          )}
          {onShowOptimization && (
            <ToolbarButton
              icon={<BarChart3 className="w-4 h-4" />}
              label="Optimize"
              onClick={onShowOptimization}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            />
          )}
          {onShowTemplates && (
            <ToolbarButton
              icon={<LayoutTemplate className="w-4 h-4" />}
              label="Templates"
              onClick={onShowTemplates}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            />
          )}
        </div>

        <ToolbarDivider />

        {/* Quick actions */}
        {onExternalPreview && (
          <ToolbarButton
            icon={<ExternalLink className="w-4 h-4" />}
            label="Open in new tab"
            onClick={onExternalPreview}
          />
        )}
        
        {onShowShortcuts && (
          <ToolbarButton
            icon={<Keyboard className="w-4 h-4" />}
            label="Keyboard shortcuts"
            shortcut={["?"]}
            onClick={onShowShortcuts}
          />
        )}

        {/* More menu */}
        <div className="relative">
          <ToolbarButton
            icon={<MoreHorizontal className="w-4 h-4" />}
            label="More options"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          />
          
          <AnimatePresence>
            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 py-1 bg-popover border rounded-md shadow-lg z-50 min-w-[180px]"
                >
                  {onRefresh && (
                    <button
                      onClick={() => {
                        onRefresh();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh preview
                    </button>
                  )}
                  {onExport && (
                    <button
                      onClick={() => {
                        onExport();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export page
                    </button>
                  )}
                  {onSettings && (
                    <>
                      <div className="border-t my-1" />
                      <button
                        onClick={() => {
                          onSettings();
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Editor settings
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <ToolbarDivider />

        {/* Save button */}
        <ToolbarButton
          icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          label={isSaving ? "Saving..." : "Save"}
          shortcut={["Ctrl", "S"]}
          onClick={onSave}
          disabled={isSaving || !hasChanges}
          variant="primary"
        />

        {rightContent}
      </div>
    </div>
  );
}

export default EditorToolbar;
