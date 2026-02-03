/**
 * DRAMAC Studio Command Palette
 * 
 * Searchable command palette using shadcn/ui Command component.
 * Opens with Cmd/Ctrl+K.
 * 
 * @phase STUDIO-20
 */

"use client";

import { useEffect, useMemo, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore, useEditorStore, useSelectionStore, undo, redo } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import {
  Save,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Keyboard,
  Layers,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Image,
  Square,
  Layout,
  MessageSquare,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Grid3X3,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface CommandItemData {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "file" | "edit" | "view" | "components" | "ai" | "settings" | "panels";
  keywords?: string[];
}

interface CommandPaletteProps {
  onSave?: () => Promise<void>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CommandPalette({ onSave }: CommandPaletteProps) {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const selectedId = useSelectionStore((s) => s.componentId);

  // Actions
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const duplicateComponent = useEditorStore((s) => s.duplicateComponent);
  const addComponent = useEditorStore((s) => s.addComponent);

  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const zoomIn = useUIStore((s) => s.zoomIn);
  const zoomOut = useUIStore((s) => s.zoomOut);
  const resetZoom = useUIStore((s) => s.resetZoom);
  const setShortcutsPanelOpen = useUIStore((s) => s.setShortcutsPanelOpen);
  const setAIChatOpen = useUIStore((s) => s.setAIChatOpen);
  const setAIGeneratorOpen = useUIStore((s) => s.setAIGeneratorOpen);
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen);
  const setDevicePreset = useUIStore((s) => s.setDevicePreset);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const toggleOutlines = useUIStore((s) => s.toggleOutlines);
  const toggleRuler = useUIStore((s) => s.toggleRuler);

  // Build command list
  const commands = useMemo<CommandItemData[]>(() => {
    const items: CommandItemData[] = [
      // File commands
      {
        id: "save",
        label: "Save Page",
        shortcut: "⌘S",
        icon: <Save className="h-4 w-4" />,
        action: () => {
          if (onSave) {
            toast.promise(onSave(), {
              loading: "Saving...",
              success: "Page saved",
              error: "Failed to save",
            });
          } else {
            toast.info("Save handler not configured");
          }
        },
        category: "file",
        keywords: ["save", "persist", "commit"],
      },

      // Edit commands
      {
        id: "undo",
        label: "Undo",
        shortcut: "⌘Z",
        icon: <Undo2 className="h-4 w-4" />,
        action: () => {
          undo();
          toast.success("Undo", { duration: 1500 });
        },
        category: "edit",
      },
      {
        id: "redo",
        label: "Redo",
        shortcut: "⌘⇧Z",
        icon: <Redo2 className="h-4 w-4" />,
        action: () => {
          redo();
          toast.success("Redo", { duration: 1500 });
        },
        category: "edit",
      },
      {
        id: "delete",
        label: "Delete Component",
        shortcut: "Del",
        icon: <Trash2 className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            deleteComponent(selectedId);
            toast.success("Component deleted", { duration: 1500 });
          } else {
            toast.error("Select a component first");
          }
        },
        category: "edit",
        keywords: ["remove", "trash"],
      },
      {
        id: "duplicate",
        label: "Duplicate Component",
        shortcut: "⌘D",
        icon: <Copy className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            duplicateComponent(selectedId);
            toast.success("Component duplicated", { duration: 1500 });
          } else {
            toast.error("Select a component first");
          }
        },
        category: "edit",
        keywords: ["copy", "clone"],
      },

      // View commands
      {
        id: "preview",
        label: mode === "preview" ? "Exit Preview" : "Enter Preview Mode",
        shortcut: "⌘P",
        icon: mode === "preview" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
        action: () => {
          const newMode = mode === "preview" ? "edit" : "preview";
          setMode(newMode);
          toast.success(newMode === "preview" ? "Preview mode" : "Edit mode", { duration: 1500 });
        },
        category: "view",
      },
      {
        id: "zoom-in",
        label: "Zoom In",
        shortcut: "⌘+",
        icon: <ZoomIn className="h-4 w-4" />,
        action: zoomIn,
        category: "view",
      },
      {
        id: "zoom-out",
        label: "Zoom Out",
        shortcut: "⌘-",
        icon: <ZoomOut className="h-4 w-4" />,
        action: zoomOut,
        category: "view",
      },
      {
        id: "zoom-reset",
        label: "Reset Zoom to 100%",
        shortcut: "⌘0",
        icon: <RotateCcw className="h-4 w-4" />,
        action: resetZoom,
        category: "view",
      },
      {
        id: "device-desktop",
        label: "Switch to Desktop View",
        icon: <Monitor className="h-4 w-4" />,
        action: () => setDevicePreset("desktop-1920"),
        category: "view",
      },
      {
        id: "device-tablet",
        label: "Switch to Tablet View",
        icon: <Tablet className="h-4 w-4" />,
        action: () => setDevicePreset("ipad-air"),
        category: "view",
      },
      {
        id: "device-mobile",
        label: "Switch to Mobile View",
        icon: <Smartphone className="h-4 w-4" />,
        action: () => setDevicePreset("iphone-14"),
        category: "view",
      },
      {
        id: "toggle-grid",
        label: "Toggle Grid",
        icon: <Grid3X3 className="h-4 w-4" />,
        action: toggleGrid,
        category: "view",
      },
      {
        id: "toggle-ruler",
        label: "Toggle Ruler",
        icon: <Ruler className="h-4 w-4" />,
        action: toggleRuler,
        category: "view",
      },

      // Panels
      {
        id: "toggle-left-panel",
        label: "Toggle Components Panel",
        shortcut: "⌘\\",
        icon: <PanelLeft className="h-4 w-4" />,
        action: () => togglePanel("left"),
        category: "panels",
      },
      {
        id: "toggle-right-panel",
        label: "Toggle Properties Panel",
        shortcut: "⌘⇧\\",
        icon: <PanelRight className="h-4 w-4" />,
        action: () => togglePanel("right"),
        category: "panels",
      },
      {
        id: "toggle-bottom-panel",
        label: "Toggle Layers Panel",
        shortcut: "⌘J",
        icon: <PanelBottom className="h-4 w-4" />,
        action: () => togglePanel("bottom"),
        category: "panels",
      },

      // AI commands
      {
        id: "ai-chat",
        label: "Open AI Chat",
        shortcut: "⌘/",
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            setAIChatOpen(true);
          } else {
            toast.error("Select a component first");
          }
        },
        category: "ai",
        keywords: ["assistant", "copilot", "help"],
      },
      {
        id: "ai-generate",
        label: "Generate Page with AI",
        icon: <Sparkles className="h-4 w-4" />,
        action: () => setAIGeneratorOpen(true),
        category: "ai",
        keywords: ["create", "wizard", "auto"],
      },

      // Settings commands
      {
        id: "shortcuts",
        label: "Keyboard Shortcuts",
        shortcut: "⌘?",
        icon: <Keyboard className="h-4 w-4" />,
        action: () => setShortcutsPanelOpen(true),
        category: "settings",
        keywords: ["hotkeys", "keys", "help"],
      },
      {
        id: "page-settings",
        label: "Page Settings",
        icon: <Settings className="h-4 w-4" />,
        action: () => setSettingsPanelOpen(true),
        category: "settings",
      },
    ];

    // Add component shortcuts
    const allComponents = componentRegistry.getAll();
    const commonTypes = ["Heading", "Text", "Image", "Button", "Section", "Container"];
    const commonComponents = allComponents.filter((c) => commonTypes.includes(c.type)).slice(0, 10);

    for (const comp of commonComponents) {
      items.push({
        id: `add-${comp.type.toLowerCase()}`,
        label: `Add ${comp.label}`,
        icon: getComponentIcon(comp.type),
        action: () => {
          const defaultProps = componentRegistry.getDefaultProps(comp.type);
          const newId = addComponent(comp.type, defaultProps, "root");
          if (newId) {
            toast.success(`${comp.label} added`, { duration: 1500 });
          }
        },
        category: "components",
        keywords: ["insert", "new", comp.type.toLowerCase()],
      });
    }

    return items;
  }, [
    onSave,
    deleteComponent,
    duplicateComponent,
    selectedId,
    mode,
    setMode,
    zoomIn,
    zoomOut,
    resetZoom,
    setShortcutsPanelOpen,
    setAIChatOpen,
    setAIGeneratorOpen,
    setSettingsPanelOpen,
    setDevicePreset,
    togglePanel,
    toggleGrid,
    toggleRuler,
    addComponent,
  ]);

  // Run command and close palette
  const runCommand = useCallback(
    (command: CommandItemData) => {
      setOpen(false);
      // Small delay to let dialog close animation start
      requestAnimationFrame(() => {
        command.action();
      });
    },
    [setOpen]
  );

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItemData[]> = {
      file: [],
      edit: [],
      view: [],
      panels: [],
      components: [],
      ai: [],
      settings: [],
    };

    for (const cmd of commands) {
      groups[cmd.category].push(cmd);
    }

    return groups;
  }, [commands]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupedCommands).map(([category, items]) => {
          if (items.length === 0) return null;

          return (
            <CommandGroup key={category} heading={getCategoryLabel(category)}>
              {items.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(" ") ?? ""}`}
                  onSelect={() => runCommand(cmd)}
                >
                  <span className="mr-2">{cmd.icon}</span>
                  <span>{cmd.label}</span>
                  {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    file: "File",
    edit: "Edit",
    view: "View",
    panels: "Panels",
    components: "Add Component",
    ai: "AI",
    settings: "Settings",
  };
  return labels[category] || category;
}

function getComponentIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    Heading: <Type className="h-4 w-4" />,
    Text: <Type className="h-4 w-4" />,
    Image: <Image className="h-4 w-4" />,
    Button: <Square className="h-4 w-4" />,
    Section: <Layout className="h-4 w-4" />,
    Container: <Layout className="h-4 w-4" />,
  };
  return icons[type] || <Layout className="h-4 w-4" />;
}

export default CommandPalette;
