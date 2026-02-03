/**
 * Create Symbol Dialog
 * 
 * Dialog for saving a component (or component tree) as a reusable symbol.
 * Allows naming, categorizing, and tagging symbols.
 * 
 * Phase: STUDIO-25 Symbols & Reusable Components
 */

'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Package,
  X,
  Loader2,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSymbolStore } from '@/lib/studio/store/symbol-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { DEFAULT_SYMBOL_CATEGORIES } from '@/types/studio-symbols';
import type { StudioComponent } from '@/types/studio';

// =============================================================================
// TYPES
// =============================================================================

interface CreateSymbolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The component ID(s) to convert into a symbol */
  componentIds: string[];
  /** Called after successful symbol creation */
  onSymbolCreated?: (symbolId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CreateSymbolDialog({
  open,
  onOpenChange,
  componentIds,
  onSymbolCreated,
}: CreateSymbolDialogProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store hooks
  const { createSymbol } = useSymbolStore();
  const { data: pageData } = useEditorStore();

  // Get components to save
  const getComponentsToSave = useCallback((): StudioComponent[] => {
    if (!pageData || componentIds.length === 0) return [];

    const components: StudioComponent[] = [];
    const visited = new Set<string>();

    // Recursive function to get component and all descendants
    const collectComponent = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const component = pageData.components[id];
      if (!component) return;

      components.push({ ...component });

      // Collect children
      if (component.children) {
        for (const childId of component.children) {
          collectComponent(childId);
        }
      }
    };

    // Collect all selected components and their descendants
    for (const id of componentIds) {
      collectComponent(id);
    }

    // Normalize parent IDs for root-level components in selection
    return components.map((comp) => ({
      ...comp,
      // Clear parent ID if the parent is not in the selection
      parentId: comp.parentId && visited.has(comp.parentId) ? comp.parentId : undefined,
    }));
  }, [pageData, componentIds]);

  // Handle tag addition
  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // Handle tag removal
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  // Handle tag input key press
  const handleTagKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Symbol name is required');
      return;
    }

    const components = getComponentsToSave();
    if (components.length === 0) {
      setError('No components to save');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const symbol = createSymbol({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        tags,
        components,
        isGlobal,
      });

      // Reset form
      setName('');
      setDescription('');
      setCategory('custom');
      setTags([]);
      setTagInput('');
      setIsGlobal(false);

      // Close dialog
      onOpenChange(false);

      // Notify parent
      onSymbolCreated?.(symbol.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create symbol');
    } finally {
      setIsCreating(false);
    }
  }, [name, description, category, tags, isGlobal, getComponentsToSave, createSymbol, onOpenChange, onSymbolCreated]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setCategory('custom');
      setTags([]);
      setTagInput('');
      setIsGlobal(false);
      setError(null);
    }
  }, [open]);

  // Generate default name based on component type
  React.useEffect(() => {
    if (open && componentIds.length > 0 && !name) {
      const component = pageData?.components[componentIds[0]];
      if (component) {
        setName(`${component.type} Symbol`);
      }
    }
  }, [open, componentIds, pageData, name]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Save as Symbol
          </DialogTitle>
          <DialogDescription>
            Save {componentIds.length === 1 ? 'this component' : `${componentIds.length} components`} as a reusable symbol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="symbol-name">Name *</Label>
            <Input
              id="symbol-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Symbol"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="symbol-description">Description</Label>
            <Textarea
              id="symbol-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="symbol-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="symbol-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_SYMBOL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="symbol-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="symbol-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyPress}
                placeholder="Add tags..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Global toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="symbol-global" className="cursor-pointer">
                  Global Symbol
                </Label>
                <p className="text-xs text-muted-foreground">
                  Available across all sites
                </p>
              </div>
            </div>
            <Switch
              id="symbol-global"
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !name.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Create Symbol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateSymbolDialog;
