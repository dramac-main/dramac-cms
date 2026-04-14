/**
 * DRAMAC Studio Component Library
 * 
 * Clean left panel with grid-based component browser.
 * Inspired by Webflow/Framer: compact icon grid, minimal chrome.
 * Supports search, categories, drag-to-canvas, and symbols.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, X, Layers, Loader2, Package, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { CategoryAccordion } from "./category-accordion";
import { RecentlyUsed, useRecentlyUsed } from "./recently-used";
import { ComponentCard } from "./component-card";
import { SymbolsPanel } from "./symbols-panel";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { useUIStore, useEditorStore, useSelectionStore } from "@/lib/studio/store";
import { useSymbolStore } from "@/lib/studio/store/symbol-store";
import { 
  useModuleStore, 
  selectIsLoadingModules,
  selectIsModuleInitialized 
} from "@/lib/studio/store/module-store";

// =============================================================================
// COMPONENT
// =============================================================================

export function ComponentLibrary() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"components" | "symbols">("components");
  const [expandedCategories] = useState<Set<string>>(
    new Set(["layout", "typography"]) // Default expanded
  );
  
  // Recently used
  const { recentTypes, addRecent } = useRecentlyUsed();
  
  // Stores
  const togglePanel = useUIStore((s) => s.togglePanel);
  const addComponent = useEditorStore((s) => s.addComponent);
  const selectComponent = useSelectionStore((s) => s.select);
  
  // Symbol store for count badge
  const symbolCount = useSymbolStore((s) => s.symbols.length);
  
  // Module store - for real-time updates
  const isLoadingModules = useModuleStore(selectIsLoadingModules);
  const isModuleInitialized = useModuleStore(selectIsModuleInitialized);
  const moduleComponentCount = useModuleStore((s) => s.getModuleComponentCount());
  
  // Get all components grouped by category
  // Re-compute when modules change
  const groupedComponents = useMemo(() => {
    // This will include module components when they're loaded
    return componentRegistry.getGroupedByCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModuleInitialized, moduleComponentCount]);
  
  // Get active categories (only those with components)
  const activeCategories = useMemo(() => {
    return componentRegistry.getActiveCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModuleInitialized, moduleComponentCount]);
  
  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return null; // Show categories when not searching
    }
    return componentRegistry.search(searchQuery);
  }, [searchQuery]);
  
  // Handle component double-click (quick add)
  const handleQuickAdd = useCallback((type: string) => {
    const definition = componentRegistry.get(type);
    if (!definition) return;
    
    // Get default props
    const defaultProps = componentRegistry.getDefaultProps(type);
    
    // Add to canvas
    const newId = addComponent(type, defaultProps, "root");
    
    // Select the new component
    selectComponent(newId);
    
    // Add to recently used
    addRecent(type);
  }, [addComponent, selectComponent, addRecent]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape clears search
    if (e.key === "Escape" && searchQuery) {
      e.preventDefault();
      clearSearch();
    }
  }, [searchQuery, clearSearch]);
  
  // Listen for component drops to add to recently used
  useEffect(() => {
    const handleDrop = (e: CustomEvent<{ type: string }>) => {
      addRecent(e.detail.type);
    };
    
    window.addEventListener("studio:component-dropped", handleDrop as EventListener);
    return () => {
      window.removeEventListener("studio:component-dropped", handleDrop as EventListener);
    };
  }, [addRecent]);
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PanelHeader
        title="Components"
        icon={Layers}
        position="left"
        onCollapse={() => togglePanel("left")}
      />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "components" | "symbols")} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-3 pt-1.5 pb-1.5">
          <TabsList className="w-full h-8 bg-muted/40">
            <TabsTrigger value="components" className="flex-1 text-[11px] gap-1 h-7">
              <Layers className="h-3 w-3" />
              Elements
            </TabsTrigger>
            <TabsTrigger value="symbols" className="flex-1 text-[11px] gap-1 h-7">
              <Box className="h-3 w-3" />
              Symbols
              {symbolCount > 0 && (
                <span className="ml-0.5 text-[9px] bg-primary/20 text-primary px-1 rounded-full">
                  {symbolCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Components Tab */}
        <TabsContent value="components" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          {/* Search — compact */}
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search elements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 pl-7 pr-7 text-xs bg-muted/30 border-border/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={clearSearch}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Component List */}
          <ScrollArea className="flex-1">
            {filteredComponents !== null ? (
              /* Search results — grid layout */
              <div className="p-2">
                {filteredComponents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-muted-foreground">
                      No results for &quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-2 px-1">
                      {filteredComponents.length} result{filteredComponents.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {filteredComponents.map((definition) => (
                        <ComponentCard
                          key={definition.type}
                          definition={definition}
                          onDoubleClick={() => handleQuickAdd(definition.type)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Category view */
              <div>
                {/* Module Loading */}
                {isLoadingModules && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50 bg-muted/30">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Loading modules...</span>
                  </div>
                )}
                
                {/* Module Badge */}
                {moduleComponentCount > 0 && !isLoadingModules && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50 bg-primary/5">
                    <Package className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary">
                      {moduleComponentCount} module element{moduleComponentCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                
                {/* Recently Used */}
                <RecentlyUsed
                  componentTypes={recentTypes}
                  onComponentDoubleClick={handleQuickAdd}
                />
                
                {/* Categories */}
                {activeCategories.map((category) => {
                  const components = groupedComponents.get(category.id) || [];
                  return (
                    <CategoryAccordion
                      key={category.id}
                      category={category}
                      components={components}
                      defaultOpen={expandedCategories.has(category.id)}
                      onComponentDoubleClick={handleQuickAdd}
                    />
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer — minimal */}
          <div className="border-t border-border/50 px-3 py-1.5 text-center">
            <p className="text-[10px] text-muted-foreground/60">
              {componentRegistry.count} elements
              {moduleComponentCount > 0 && (
                <> &middot; {moduleComponentCount} from modules</>
              )}
            </p>
          </div>
        </TabsContent>
        
        {/* Symbols Tab */}
        <TabsContent value="symbols" className="flex-1 overflow-hidden m-0 p-0">
          <SymbolsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
