/**
 * Template Browser Component
 * 
 * Full-screen dialog for browsing and inserting section templates.
 * Displays templates by category with search, filtering, and preview.
 * 
 * Phase: STUDIO-24 Section Templates
 */

'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState, useTransition, useDeferredValue } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  LayoutGrid, 
  Plus,
  Star,
  Sparkles,
  Crown,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplateStore } from '@/lib/studio/store/template-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { 
  TEMPLATE_CATEGORIES, 
  type SectionTemplate,
  type TemplateCategory,
} from '@/types/studio-templates';
import { prepareTemplateForInsertion, DEFAULT_SITE_COLORS } from '@/lib/studio/utils/template-utils';
import { toast } from 'sonner';

// Category icons mapping
const CATEGORY_ICONS: Partial<Record<TemplateCategory, React.ReactNode>> = {
  hero: <Sparkles className="h-4 w-4" />,
  features: <LayoutGrid className="h-4 w-4" />,
  pricing: <Crown className="h-4 w-4" />,
  testimonials: <Star className="h-4 w-4" />,
  cta: <Plus className="h-4 w-4" />,
  team: <LayoutGrid className="h-4 w-4" />,
  faq: <LayoutGrid className="h-4 w-4" />,
  contact: <LayoutGrid className="h-4 w-4" />,
  footer: <LayoutGrid className="h-4 w-4" />,
  gallery: <LayoutGrid className="h-4 w-4" />,
  stats: <LayoutGrid className="h-4 w-4" />,
  newsletter: <LayoutGrid className="h-4 w-4" />,
};

interface TemplateBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insertPosition?: 'start' | 'end' | number;
}

export function TemplateBrowser({ 
  open, 
  onOpenChange,
  insertPosition = 'end',
}: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  
  // Use deferred value for search to improve responsiveness
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  
  const { insertComponents, data: pageData } = useEditorStore();
  
  // Get templates from store
  const templates = useTemplateStore((state) => state.templates);
  const isLoading = useTemplateStore((state) => state.isLoading);
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);
  
  // Fetch templates on mount if empty
  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  // Filter templates based on search and category (use deferred query for responsiveness)
  const filteredTemplates = useMemo(() => {
    let result = templates;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }
    
    // Filter by search query (using deferred value)
    if (deferredSearchQuery.trim()) {
      const query = deferredSearchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [templates, selectedCategory, deferredSearchQuery]);

  // Group templates by category for display
  const templatesByCategory = useMemo(() => {
    const grouped = new Map<TemplateCategory, SectionTemplate[]>();
    
    for (const template of filteredTemplates) {
      const existing = grouped.get(template.category) || [];
      grouped.set(template.category, [...existing, template]);
    }
    
    return grouped;
  }, [filteredTemplates]);

  // Handle template insertion with async scheduling
  const handleInsertTemplate = useCallback(async (template: SectionTemplate) => {
    setIsInserting(true);
    
    try {
      // Close dialog first for perceived performance
      onOpenChange(false);
      
      // Use requestAnimationFrame to allow UI update before heavy work
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Get site colors (use defaults for now, could be fetched from site settings)
      const siteColors = DEFAULT_SITE_COLORS;
      
      // Prepare components for insertion
      const preparedComponents = prepareTemplateForInsertion(template, siteColors);
      
      // Calculate insert index
      let insertIndex: number;
      if (insertPosition === 'start') {
        insertIndex = 0;
      } else if (insertPosition === 'end') {
        // Get root level components count (use root.children)
        insertIndex = pageData?.root?.children?.length || 0;
      } else {
        insertIndex = insertPosition;
      }
      
      // Insert components into page (wrap in transition for non-blocking update)
      startTransition(() => {
        const insertedIds = insertComponents(preparedComponents, insertIndex);
        if (insertedIds.length > 0) {
          toast.success(`Added "${template.name}" section`, {
            description: `${insertedIds.length} component${insertedIds.length > 1 ? 's' : ''} added`,
          });
        }
      });
    } catch (error) {
      console.error('Failed to insert template:', error);
      toast.error('Failed to insert template');
    } finally {
      setIsInserting(false);
    }
  }, [insertPosition, pageData, insertComponents, onOpenChange, startTransition]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedCategory('all');
      setHoveredTemplate(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Add Section
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Category sidebar */}
          <div className="w-48 border-r bg-muted/30 p-4">
            <ScrollArea className="h-full">
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  All Templates
                </button>
                
                {TEMPLATE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors capitalize',
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    {CATEGORY_ICONS[category.id]}
                    {category.label}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </div>

          {/* Templates grid */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {selectedCategory === 'all' ? (
                // Show templates grouped by category
                <div className="space-y-8">
                  {Array.from(templatesByCategory.entries()).map(([category, categoryTemplates]) => (
                    <section key={category}>
                      <h3 className="text-lg font-semibold capitalize mb-4">
                        {category}
                      </h3>
                      <TemplateGrid
                        templates={categoryTemplates}
                        hoveredTemplate={hoveredTemplate}
                        setHoveredTemplate={setHoveredTemplate}
                        onInsert={handleInsertTemplate}
                        isInserting={isInserting}
                      />
                    </section>
                  ))}
                  
                  {templatesByCategory.size === 0 && (
                    <EmptyState searchQuery={searchQuery} />
                  )}
                </div>
              ) : (
                // Show flat grid for single category
                <>
                  <TemplateGrid
                    templates={filteredTemplates}
                    hoveredTemplate={hoveredTemplate}
                    setHoveredTemplate={setHoveredTemplate}
                    onInsert={handleInsertTemplate}
                    isInserting={isInserting}
                  />
                  
                  {filteredTemplates.length === 0 && (
                    <EmptyState searchQuery={searchQuery} />
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Template card grid
interface TemplateGridProps {
  templates: SectionTemplate[];
  hoveredTemplate: string | null;
  setHoveredTemplate: (id: string | null) => void;
  onInsert: (template: SectionTemplate) => void;
  isInserting: boolean;
}

function TemplateGrid({
  templates,
  hoveredTemplate,
  setHoveredTemplate,
  onInsert,
  isInserting,
}: TemplateGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isHovered={hoveredTemplate === template.id}
          onHover={() => setHoveredTemplate(template.id)}
          onLeave={() => setHoveredTemplate(null)}
          onInsert={() => onInsert(template)}
          isInserting={isInserting}
        />
      ))}
    </div>
  );
}

// Individual template card
interface TemplateCardProps {
  template: SectionTemplate;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onInsert: () => void;
  isInserting: boolean;
}

function TemplateCard({
  template,
  isHovered,
  onHover,
  onLeave,
  onInsert,
  isInserting,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        'group relative border rounded-lg overflow-hidden bg-card transition-all',
        isHovered ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Thumbnail / Preview */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {/* Placeholder preview - could be enhanced with actual thumbnails */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
          <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
        </div>
        
        {/* Premium badge */}
        {template.isPremium && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-amber-500/90 text-white"
          >
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        )}
        
        {/* Hover overlay with insert button */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            onClick={onInsert}
            disabled={isInserting}
            className="shadow-lg"
          >
            {isInserting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Section
          </Button>
        </div>
      </div>

      {/* Template info */}
      <div className="p-3">
        <h4 className="font-medium text-sm truncate">{template.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {template.description}
        </p>
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state when no templates match
interface EmptyStateProps {
  searchQuery: string;
}

function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <LayoutGrid className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium">No templates found</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {searchQuery 
          ? `No templates match "${searchQuery}"`
          : 'No templates available in this category'}
      </p>
    </div>
  );
}

export default TemplateBrowser;
