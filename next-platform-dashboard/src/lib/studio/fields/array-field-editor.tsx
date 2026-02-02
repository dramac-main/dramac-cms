// src/lib/studio/fields/array-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ArrayFieldEditorProps, FieldDefinition } from '@/types/studio';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  List
} from 'lucide-react';
import { nanoid } from 'nanoid';

// Import field renderer (will be provided by parent)
// This creates a circular dependency that we handle via context
interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

type FieldRendererComponent = React.ComponentType<FieldRendererProps>;

// Context to receive field renderer from parent
const FieldRendererContext = React.createContext<FieldRendererComponent | null>(null);

export function ArrayFieldEditorProvider({ 
  children, 
  fieldRenderer 
}: { 
  children: React.ReactNode; 
  fieldRenderer: FieldRendererComponent;
}) {
  return (
    <FieldRendererContext.Provider value={fieldRenderer}>
      {children}
    </FieldRendererContext.Provider>
  );
}

interface ArrayItemProps {
  item: Record<string, unknown>;
  index: number;
  itemFields: Record<string, FieldDefinition>;
  onUpdate: (index: number, newItem: Record<string, unknown>) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  itemLabel?: string;
  FieldRenderer: FieldRendererComponent;
}

function ArrayItem({
  item,
  index,
  itemFields,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled,
  itemLabel = 'Item',
  FieldRenderer,
}: ArrayItemProps) {
  const [isOpen, setIsOpen] = React.useState(index === 0);
  
  // Get display title from item (use first text field or index)
  const getItemTitle = (): string => {
    // Try to find a title/label/name field
    for (const key of ['title', 'label', 'name', 'text', 'heading']) {
      if (item[key] && typeof item[key] === 'string') {
        return String(item[key]).substring(0, 30);
      }
    }
    return `${itemLabel} ${index + 1}`;
  };
  
  // Handle field change within item
  const handleFieldChange = React.useCallback((fieldName: string, value: unknown) => {
    onUpdate(index, { ...item, [fieldName]: value });
  }, [index, item, onUpdate]);

  return (
    <div className={cn(
      "border rounded-lg",
      isOpen ? "border-border" : "border-transparent hover:border-border"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-1 p-2">
          {/* Drag handle (visual only for now) */}
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
          
          {/* Expand/collapse trigger */}
          <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left hover:bg-muted/50 rounded px-2 py-1">
            <span className="text-sm font-medium truncate">{getItemTitle()}</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          {/* Move buttons */}
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMoveUp(index)}
              disabled={disabled || isFirst}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMoveDown(index)}
              disabled={disabled || isLast}
              title="Move down"
            >
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &quot;{getItemTitle()}&quot; from the list. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(index)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {Object.entries(itemFields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={item[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ArrayFieldEditor({
  value = [],
  onChange,
  itemFields,
  label,
  description,
  disabled = false,
  itemLabel = 'Item',
  minItems = 0,
  maxItems,
}: ArrayFieldEditorProps) {
  const FieldRenderer = React.useContext(FieldRendererContext);
  
  if (!FieldRenderer) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          ArrayFieldEditor requires a FieldRenderer context. Wrap with ArrayFieldEditorProvider.
        </p>
      </div>
    );
  }
  
  // Ensure value is an array
  const items = Array.isArray(value) ? value as Record<string, unknown>[] : [];
  
  // Add new item
  const handleAdd = React.useCallback(() => {
    if (maxItems && items.length >= maxItems) return;
    
    // Create default item from field definitions
    const newItem: Record<string, unknown> = { _id: nanoid() };
    Object.entries(itemFields).forEach(([key, field]) => {
      newItem[key] = field.defaultValue ?? '';
    });
    
    onChange([...items, newItem]);
  }, [items, itemFields, onChange, maxItems]);
  
  // Update item at index
  const handleUpdate = React.useCallback((index: number, newItem: Record<string, unknown>) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onChange(newItems);
  }, [items, onChange]);
  
  // Remove item at index
  const handleRemove = React.useCallback((index: number) => {
    if (items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange, minItems]);
  
  // Move item up
  const handleMoveUp = React.useCallback((index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  }, [items, onChange]);
  
  // Move item down
  const handleMoveDown = React.useCallback((index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  }, [items, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
          <span className="text-xs text-muted-foreground">
            ({items.length}{maxItems ? `/${maxItems}` : ''})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || (maxItems ? items.length >= maxItems : false)}
          className="h-7"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add {itemLabel}
        </Button>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {/* Items list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No items yet. Click &quot;Add {itemLabel}&quot; to create one.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <ArrayItem
              key={(item._id as string) || index}
              item={item}
              index={index}
              itemFields={itemFields}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              disabled={disabled || items.length <= minItems}
              itemLabel={itemLabel}
              FieldRenderer={FieldRenderer}
            />
          ))
        )}
      </div>
      
      {/* Min/Max info */}
      {(minItems > 0 || maxItems) && (
        <p className="text-xs text-muted-foreground">
          {minItems > 0 && `Minimum: ${minItems}`}
          {minItems > 0 && maxItems && ' | '}
          {maxItems && `Maximum: ${maxItems}`}
        </p>
      )}
    </div>
  );
}

export default ArrayFieldEditor;
