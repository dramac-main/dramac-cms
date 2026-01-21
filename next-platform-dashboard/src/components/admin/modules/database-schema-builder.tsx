'use client'

/**
 * Database Schema Builder Component
 * 
 * Phase EM-10: Visual schema builder for modules with database capabilities
 * 
 * This component provides:
 * - Visual table definition
 * - Column configuration (type, nullable, default, references)
 * - Index management
 * - RLS policy templates
 */

import { useState, useCallback } from 'react'
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Database,
  Key,
  Shield,
  Copy,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { 
  ModuleTable, 
  ColumnDefinition, 
  ColumnType,
  RLSPolicy
} from '@/lib/modules/types/module-types-v2'
import { cn } from '@/lib/utils'

// =============================================================
// TYPES
// =============================================================

interface DatabaseSchemaBuilderProps {
  tables: ModuleTable[]
  onChange: (tables: ModuleTable[]) => void
  disabled?: boolean
  shortId?: string // For preview of actual table names
}

// Column type options
const COLUMN_TYPES: { value: ColumnType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Variable length string' },
  { value: 'integer', label: 'Integer', description: 'Whole numbers' },
  { value: 'decimal', label: 'Decimal', description: 'Numbers with decimals' },
  { value: 'boolean', label: 'Boolean', description: 'True/false values' },
  { value: 'uuid', label: 'UUID', description: 'Unique identifier' },
  { value: 'jsonb', label: 'JSON', description: 'JSON data' },
  { value: 'timestamp', label: 'Timestamp', description: 'Date and time' },
  { value: 'date', label: 'Date', description: 'Date only' },
  { value: 'time', label: 'Time', description: 'Time only' },
  { value: 'text[]', label: 'Text Array', description: 'List of strings' },
  { value: 'integer[]', label: 'Integer Array', description: 'List of numbers' },
]

// RLS policy templates
const RLS_TEMPLATES = [
  {
    name: 'Site Isolation',
    action: 'ALL' as const,
    using: 'site_id = current_setting(\'app.current_site_id\')::uuid',
    with_check: 'site_id = current_setting(\'app.current_site_id\')::uuid'
  },
  {
    name: 'Owner Only',
    action: 'ALL' as const,
    using: 'user_id = auth.uid()',
    with_check: 'user_id = auth.uid()'
  },
  {
    name: 'Public Read',
    action: 'SELECT' as const,
    using: 'true',
    with_check: undefined
  },
  {
    name: 'Authenticated Insert',
    action: 'INSERT' as const,
    using: 'true',
    with_check: 'auth.uid() IS NOT NULL'
  }
]

// =============================================================
// MAIN COMPONENT
// =============================================================

export function DatabaseSchemaBuilder({ 
  tables, 
  onChange, 
  disabled,
  shortId 
}: DatabaseSchemaBuilderProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  // Toggle table expansion
  const toggleTable = useCallback((tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev)
      if (next.has(tableName)) {
        next.delete(tableName)
      } else {
        next.add(tableName)
      }
      return next
    })
  }, [])

  // Add a new table
  const addTable = useCallback(() => {
    const newTable: ModuleTable = {
      name: `table_${tables.length + 1}`,
      description: '',
      schema: {},
      rls_policies: [],
      indexes: []
    }
    onChange([...tables, newTable])
    setExpandedTables(prev => new Set(prev).add(newTable.name))
  }, [tables, onChange])

  // Update a table
  const updateTable = useCallback((index: number, updates: Partial<ModuleTable>) => {
    const updated = [...tables]
    const oldName = updated[index].name
    updated[index] = { ...updated[index], ...updates }
    
    // Update expanded tables set if name changed
    if (updates.name && updates.name !== oldName) {
      setExpandedTables(prev => {
        const next = new Set(prev)
        if (next.has(oldName)) {
          next.delete(oldName)
          next.add(updates.name!)
        }
        return next
      })
    }
    
    onChange(updated)
  }, [tables, onChange])

  // Remove a table
  const removeTable = useCallback((index: number) => {
    const tableName = tables[index].name
    setExpandedTables(prev => {
      const next = new Set(prev)
      next.delete(tableName)
      return next
    })
    onChange(tables.filter((_, i) => i !== index))
  }, [tables, onChange])

  // Duplicate a table
  const duplicateTable = useCallback((index: number) => {
    const original = tables[index]
    const newTable: ModuleTable = {
      ...original,
      name: `${original.name}_copy`,
      schema: { ...original.schema },
      rls_policies: [...original.rls_policies],
      indexes: [...original.indexes]
    }
    onChange([...tables, newTable])
    setExpandedTables(prev => new Set(prev).add(newTable.name))
  }, [tables, onChange])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema
          </h3>
          <p className="text-sm text-muted-foreground">
            Define the database tables for this module
          </p>
        </div>
        <Button onClick={addTable} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState onAdd={addTable} disabled={disabled} />
      ) : (
        <div className="space-y-4">
          {tables.map((table, tableIndex) => (
            <TableEditor
              key={`${table.name}-${tableIndex}`}
              table={table}
              tableIndex={tableIndex}
              expanded={expandedTables.has(table.name)}
              shortId={shortId}
              allTables={tables}
              onToggle={() => toggleTable(table.name)}
              onUpdate={(updates) => updateTable(tableIndex, updates)}
              onRemove={() => removeTable(tableIndex)}
              onDuplicate={() => duplicateTable(tableIndex)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================
// TABLE EDITOR
// =============================================================

interface TableEditorProps {
  table: ModuleTable
  tableIndex: number
  expanded: boolean
  shortId?: string
  allTables: ModuleTable[]
  onToggle: () => void
  onUpdate: (updates: Partial<ModuleTable>) => void
  onRemove: () => void
  onDuplicate: () => void
  disabled?: boolean
}

function TableEditor({
  table,
  tableIndex: _tableIndex,
  expanded,
  shortId,
  allTables,
  onToggle,
  onUpdate,
  onRemove,
  onDuplicate,
  disabled
}: TableEditorProps) {
  // Add column
  const addColumn = useCallback(() => {
    const colNum = Object.keys(table.schema).length + 1
    onUpdate({
      schema: {
        ...table.schema,
        [`column_${colNum}`]: {
          type: 'text',
          nullable: true
        }
      }
    })
  }, [table.schema, onUpdate])

  // Update column
  const updateColumn = useCallback((
    oldName: string, 
    newName: string, 
    definition: ColumnDefinition
  ) => {
    const schema = { ...table.schema }
    
    if (oldName !== newName) {
      delete schema[oldName]
    }
    schema[newName] = definition
    
    onUpdate({ schema })
  }, [table.schema, onUpdate])

  // Remove column
  const removeColumn = useCallback((columnName: string) => {
    const schema = { ...table.schema }
    delete schema[columnName]
    
    // Also remove from indexes if present
    const indexes = table.indexes.filter(idx => !idx.includes(columnName))
    
    onUpdate({ schema, indexes })
  }, [table.schema, table.indexes, onUpdate])

  // Toggle index
  const toggleIndex = useCallback((columnName: string) => {
    const indexes = table.indexes.includes(columnName)
      ? table.indexes.filter(idx => idx !== columnName)
      : [...table.indexes, columnName]
    onUpdate({ indexes })
  }, [table.indexes, onUpdate])

  // Add RLS policy
  const addPolicy = useCallback((template?: typeof RLS_TEMPLATES[0]) => {
    const policy: RLSPolicy = template 
      ? { ...template }
      : {
          name: `policy_${table.rls_policies.length + 1}`,
          action: 'ALL',
          using: 'true'
        }
    onUpdate({
      rls_policies: [...table.rls_policies, policy]
    })
  }, [table.rls_policies, onUpdate])

  // Update RLS policy
  const updatePolicy = useCallback((index: number, updates: Partial<RLSPolicy>) => {
    const policies = [...table.rls_policies]
    policies[index] = { ...policies[index], ...updates }
    onUpdate({ rls_policies: policies })
  }, [table.rls_policies, onUpdate])

  // Remove RLS policy
  const removePolicy = useCallback((index: number) => {
    onUpdate({
      rls_policies: table.rls_policies.filter((_, i) => i !== index)
    })
  }, [table.rls_policies, onUpdate])

  const actualTableName = shortId 
    ? `mod_${shortId}_${table.name}` 
    : table.name

  return (
    <Card className={cn(
      'transition-all',
      expanded && 'ring-1 ring-primary/20'
    )}>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input
                  value={table.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="font-mono"
                  placeholder="table_name"
                  disabled={disabled}
                />
                <Input
                  value={table.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Description..."
                  disabled={disabled}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="secondary" className="font-mono text-xs">
                {Object.keys(table.schema).length} cols
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDuplicate}
                      disabled={disabled}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate table</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {shortId && (
            <div className="text-xs text-muted-foreground font-mono mt-2">
              → {actualTableName}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-6">
            {/* Auto-generated columns info */}
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              Auto-included: 
              <code className="px-1.5 py-0.5 bg-background rounded text-xs">id (UUID PK)</code>
              <code className="px-1.5 py-0.5 bg-background rounded text-xs">created_at</code>
              <code className="px-1.5 py-0.5 bg-background rounded text-xs">updated_at</code>
            </div>

            {/* Column definitions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Columns
              </h4>
              
              <div className="space-y-2">
                {Object.entries(table.schema).map(([colName, colDef]) => (
                  <ColumnRow
                    key={colName}
                    columnName={colName}
                    definition={colDef}
                    allTables={allTables}
                    isIndexed={table.indexes.includes(colName)}
                    onUpdate={(newName, newDef) => updateColumn(colName, newName, newDef)}
                    onRemove={() => removeColumn(colName)}
                    onToggleIndex={() => toggleIndex(colName)}
                    disabled={disabled}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
                className="mt-3"
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>

            {/* RLS Policies */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Row Level Security Policies
              </h4>
              
              <div className="space-y-2 mb-3">
                {table.rls_policies.map((policy, index) => (
                  <PolicyRow
                    key={`${policy.name}-${index}`}
                    policy={policy}
                    onUpdate={(updates) => updatePolicy(index, updates)}
                    onRemove={() => removePolicy(index)}
                    disabled={disabled}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPolicy()}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Custom Policy
                </Button>
                
                {RLS_TEMPLATES.map((template) => (
                  <Button
                    key={template.name}
                    variant="ghost"
                    size="sm"
                    onClick={() => addPolicy(template)}
                    disabled={disabled}
                  >
                    + {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// =============================================================
// COLUMN ROW
// =============================================================

interface ColumnRowProps {
  columnName: string
  definition: ColumnDefinition
  allTables: ModuleTable[]
  isIndexed: boolean
  onUpdate: (newName: string, definition: ColumnDefinition) => void
  onRemove: () => void
  onToggleIndex: () => void
  disabled?: boolean
}

function ColumnRow({
  columnName,
  definition,
  allTables,
  isIndexed,
  onUpdate,
  onRemove,
  onToggleIndex,
  disabled
}: ColumnRowProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="p-3 border rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        
        <Input
          value={columnName}
          onChange={(e) => onUpdate(e.target.value, definition)}
          className="w-36 font-mono"
          placeholder="column_name"
          disabled={disabled}
        />
        
        <Select
          value={definition.type}
          onValueChange={(type) => onUpdate(columnName, {
            ...definition,
            type: type as ColumnType
          })}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMN_TYPES.map((ct) => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Switch
            checked={!definition.nullable}
            onCheckedChange={(required) => onUpdate(columnName, {
              ...definition,
              nullable: !required
            })}
            disabled={disabled}
          />
          <Label className="text-xs">Required</Label>
        </div>

        <div className="flex items-center gap-1.5">
          <Switch
            checked={isIndexed}
            onCheckedChange={onToggleIndex}
            disabled={disabled}
          />
          <Label className="text-xs">Index</Label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto"
        >
          {showAdvanced ? 'Less' : 'More'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div>
            <Label className="text-xs text-muted-foreground">Default Value</Label>
            <Input
              value={definition.default || ''}
              onChange={(e) => onUpdate(columnName, {
                ...definition,
                default: e.target.value || undefined
              })}
              placeholder="e.g., 'value' or NOW()"
              className="mt-1"
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Unique</Label>
            <div className="mt-2">
              <Switch
                checked={definition.unique || false}
                onCheckedChange={(unique) => onUpdate(columnName, {
                  ...definition,
                  unique
                })}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Foreign Key</Label>
            <Select
              value={definition.references ? `${definition.references.table}.${definition.references.column}` : 'none'}
              onValueChange={(val) => {
                if (val === 'none') {
                  onUpdate(columnName, {
                    ...definition,
                    references: undefined
                  })
                } else {
                  const [table, column] = val.split('.')
                  onUpdate(columnName, {
                    ...definition,
                    references: { table, column, onDelete: 'SET NULL' }
                  })
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select reference..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No reference</SelectItem>
                <SelectItem value="profiles.id">profiles.id</SelectItem>
                <SelectItem value="sites.id">sites.id</SelectItem>
                {allTables.map((t) => (
                  <SelectItem key={t.name} value={`${t.name}.id`}>
                    {t.name}.id
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================
// POLICY ROW
// =============================================================

interface PolicyRowProps {
  policy: RLSPolicy
  onUpdate: (updates: Partial<RLSPolicy>) => void
  onRemove: () => void
  disabled?: boolean
}

function PolicyRow({ policy, onUpdate, onRemove, disabled }: PolicyRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        
        <Input
          value={policy.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-40 font-mono"
          placeholder="policy_name"
          disabled={disabled}
        />
        
        <Select
          value={policy.action}
          onValueChange={(action) => onUpdate({ action: action as RLSPolicy['action'] })}
          disabled={disabled}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            <SelectItem value="SELECT">SELECT</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="ml-auto"
        >
          {expanded ? 'Hide SQL' : 'Show SQL'}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">USING (read condition)</Label>
            <Textarea
              value={policy.using}
              onChange={(e) => onUpdate({ using: e.target.value })}
              className="font-mono text-xs mt-1"
              placeholder="e.g., site_id = current_setting('app.current_site_id')::uuid"
              rows={2}
              disabled={disabled}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">WITH CHECK (write condition, optional)</Label>
            <Textarea
              value={policy.with_check || ''}
              onChange={(e) => onUpdate({ with_check: e.target.value || undefined })}
              className="font-mono text-xs mt-1"
              placeholder="e.g., user_id = auth.uid()"
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="text-center p-12 border-2 border-dashed rounded-lg">
      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-medium text-lg mb-2">No Database Tables</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Define the database tables your module needs. Each table will be created 
        with a unique prefix to avoid conflicts.
      </p>
      <Button onClick={onAdd} disabled={disabled}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Table
      </Button>
    </div>
  )
}

// =============================================================
// EXPORTS
// =============================================================

export default DatabaseSchemaBuilder
