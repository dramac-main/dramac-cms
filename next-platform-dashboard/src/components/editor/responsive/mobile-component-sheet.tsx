"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Type,
  Image,
  Square,
  LayoutGrid,
  Users,
  MessageSquare,
  BarChart3,
  Layers,
  FormInput,
  Navigation,
  Video,
  Map,
  Code,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComponentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
  isPremium?: boolean;
}

interface MobileComponentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: ComponentOption[];
  onSelect: (componentId: string) => void;
  /** Filter components to only show certain categories */
  categoryFilter?: string[];
}

// Default components if none provided
const defaultComponents: ComponentOption[] = [
  { id: "text", name: "Text", icon: <Type className="h-5 w-5" />, category: "Basic", description: "Add headings, paragraphs, and text" },
  { id: "image", name: "Image", icon: <Image className="h-5 w-5" />, category: "Basic", description: "Add images with captions" },
  { id: "button", name: "Button", icon: <Square className="h-5 w-5" />, category: "Basic", description: "Call-to-action buttons" },
  { id: "container", name: "Container", icon: <Layers className="h-5 w-5" />, category: "Layout", description: "Group components together" },
  { id: "gallery", name: "Gallery", icon: <LayoutGrid className="h-5 w-5" />, category: "Media", description: "Image gallery grid" },
  { id: "team", name: "Team", icon: <Users className="h-5 w-5" />, category: "Sections", description: "Team member cards" },
  { id: "faq", name: "FAQ", icon: <MessageSquare className="h-5 w-5" />, category: "Sections", description: "Frequently asked questions" },
  { id: "stats", name: "Stats", icon: <BarChart3 className="h-5 w-5" />, category: "Sections", description: "Statistics and numbers" },
  { id: "form", name: "Form", icon: <FormInput className="h-5 w-5" />, category: "Interactive", description: "Contact and input forms" },
  { id: "navigation", name: "Navigation", icon: <Navigation className="h-5 w-5" />, category: "Layout", description: "Navigation menus" },
  { id: "video", name: "Video", icon: <Video className="h-5 w-5" />, category: "Media", description: "Embed videos" },
  { id: "map", name: "Map", icon: <Map className="h-5 w-5" />, category: "Interactive", description: "Location maps" },
  { id: "code", name: "Code", icon: <Code className="h-5 w-5" />, category: "Advanced", description: "Custom HTML/code blocks" },
];

export function MobileComponentSheet({
  open,
  onOpenChange,
  components = defaultComponents,
  onSelect,
  categoryFilter,
}: MobileComponentSheetProps) {
  const [search, setSearch] = useState("");

  // Filter and group components
  const { filtered, grouped, categories } = useMemo(() => {
    let filtered = components;

    // Apply category filter if provided
    if (categoryFilter?.length) {
      filtered = filtered.filter((c) =>
        categoryFilter.includes(c.category)
      );
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.category.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    // Group by category
    const grouped = filtered.reduce(
      (acc, c) => {
        if (!acc[c.category]) acc[c.category] = [];
        acc[c.category].push(c);
        return acc;
      },
      {} as Record<string, ComponentOption[]>
    );

    // Get sorted category names
    const categories = Object.keys(grouped).sort((a, b) => {
      // Put "Basic" first, then "Layout", then alphabetically
      if (a === "Basic") return -1;
      if (b === "Basic") return 1;
      if (a === "Layout") return -1;
      if (b === "Layout") return 1;
      return a.localeCompare(b);
    });

    return { filtered, grouped, categories };
  }, [components, categoryFilter, search]);

  const handleSelect = (componentId: string) => {
    onSelect(componentId);
    onOpenChange(false);
    setSearch(""); // Reset search on selection
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Add Component</SheetTitle>
          <SheetDescription>
            Select a component to add to your page
          </SheetDescription>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
            aria-label="Search components"
          />
        </div>

        {/* Components List */}
        <ScrollArea className="h-[calc(85vh-180px)]">
          <div className="space-y-6 pb-8 pr-4">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No components found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {grouped[category].map((component) => (
                      <button
                        key={component.id}
                        onClick={() => handleSelect(component.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2",
                          "p-4 rounded-xl border bg-card",
                          "hover:bg-accent hover:border-accent-foreground/20",
                          "active:scale-95 transition-all duration-150",
                          "touch-manipulation min-h-[88px]",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        )}
                        aria-label={`Add ${component.name} component`}
                      >
                        <div className="relative">
                          {component.icon}
                          {component.isPremium && (
                            <Star className="absolute -top-1 -right-2 h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <span className="text-xs font-medium truncate max-w-full">
                          {component.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Stats */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <Badge variant="secondary" className="text-xs">
            {filtered.length} component{filtered.length !== 1 ? "s" : ""} available
          </Badge>
        </div>
      </SheetContent>
    </Sheet>
  );
}
