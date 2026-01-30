/**
 * CRM Quick Filters Component
 * 
 * PHASE-UI-10A: CRM Module UI Overhaul
 * 
 * Quick filter chips for rapid data filtering with saved presets support.
 */
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { 
  Filter, 
  X, 
  Plus, 
  ChevronDown, 
  Check, 
  Bookmark,
  Star,
  Clock,
  User,
  Building2,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in'

export interface FilterValue {
  field: string
  operator: FilterOperator
  value: string | number | string[] | boolean
  label: string
}

export interface FilterOption {
  id: string
  field: string
  label: string
  type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean' | 'date'
  options?: Array<{ value: string; label: string; color?: string }>
  icon?: React.ReactNode
}

export interface SavedFilter {
  id: string
  name: string
  filters: FilterValue[]
  isDefault?: boolean
}

export interface CRMQuickFiltersProps {
  filters: FilterValue[]
  onFiltersChange: (filters: FilterValue[]) => void
  filterOptions: FilterOption[]
  savedFilters?: SavedFilter[]
  onSaveFilter?: (name: string, filters: FilterValue[]) => void
  onDeleteSavedFilter?: (id: string) => void
  onApplySavedFilter?: (filter: SavedFilter) => void
  className?: string
}

// =============================================================================
// FILTER CHIP
// =============================================================================

interface FilterChipProps {
  filter: FilterValue
  filterOptions: FilterOption[]
  onRemove: () => void
  onUpdate: (filter: FilterValue) => void
}

function FilterChip({ filter, filterOptions, onRemove, onUpdate }: FilterChipProps) {
  const option = filterOptions.find(o => o.field === filter.field)
  if (!option) return null

  const displayValue = useMemo(() => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 2 
        ? `${filter.value.length} selected`
        : filter.value.join(', ')
    }
    if (option.options) {
      const opt = option.options.find(o => o.value === filter.value)
      return opt?.label || String(filter.value)
    }
    return String(filter.value)
  }, [filter.value, option.options])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex"
    >
      <Badge 
        variant="secondary" 
        className="pl-2 pr-1 py-1 gap-1 text-xs font-normal"
      >
        <span className="font-medium">{option.label}:</span>
        <span className="text-muted-foreground">{displayValue}</span>
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-muted rounded-sm p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    </motion.div>
  )
}

// =============================================================================
// ADD FILTER POPOVER
// =============================================================================

interface AddFilterPopoverProps {
  filterOptions: FilterOption[]
  activeFilters: FilterValue[]
  onAddFilter: (filter: FilterValue) => void
}

function AddFilterPopover({ filterOptions, activeFilters, onAddFilter }: AddFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  const selectedOption = filterOptions.find(o => o.field === selectedField)

  const availableOptions = filterOptions.filter(
    opt => !activeFilters.some(f => f.field === opt.field) || opt.type === 'multiselect'
  )

  const handleSelectField = (field: string) => {
    setSelectedField(field)
    setSelectedValues([])
  }

  const handleSelectValue = (value: string) => {
    const option = filterOptions.find(o => o.field === selectedField)
    if (!option) return

    if (option.type === 'multiselect') {
      setSelectedValues(prev => 
        prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value]
      )
    } else {
      const label = option.options?.find(o => o.value === value)?.label || value
      onAddFilter({
        field: selectedField!,
        operator: 'eq',
        value,
        label: `${option.label}: ${label}`,
      })
      setOpen(false)
      setSelectedField(null)
    }
  }

  const handleApplyMultiselect = () => {
    if (!selectedField || selectedValues.length === 0) return
    const option = filterOptions.find(o => o.field === selectedField)
    if (!option) return

    onAddFilter({
      field: selectedField,
      operator: 'in',
      value: selectedValues,
      label: `${option.label}: ${selectedValues.length} selected`,
    })
    setOpen(false)
    setSelectedField(null)
    setSelectedValues([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {!selectedField ? (
          <Command>
            <CommandInput placeholder="Search filters..." />
            <CommandList>
              <CommandEmpty>No filters found.</CommandEmpty>
              <CommandGroup>
                {availableOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelectField(option.field)}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => setSelectedField(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <span className="text-sm font-medium">{selectedOption?.label}</span>
            </div>
            
            {selectedOption?.type === 'select' || selectedOption?.type === 'multiselect' ? (
              <>
                <div className="max-h-48 overflow-auto space-y-1">
                  {selectedOption.options?.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectValue(opt.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted",
                        selectedValues.includes(opt.value) && "bg-muted"
                      )}
                    >
                      {selectedOption.type === 'multiselect' && (
                        <div className={cn(
                          "w-4 h-4 border rounded flex items-center justify-center",
                          selectedValues.includes(opt.value) && "bg-primary border-primary"
                        )}>
                          {selectedValues.includes(opt.value) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      )}
                      {opt.color && (
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: opt.color }} 
                        />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {selectedOption.type === 'multiselect' && selectedValues.length > 0 && (
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={handleApplyMultiselect}
                  >
                    Apply ({selectedValues.length} selected)
                  </Button>
                )}
              </>
            ) : (
              <Input 
                placeholder={`Enter ${selectedOption?.label.toLowerCase()}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    onAddFilter({
                      field: selectedField,
                      operator: 'contains',
                      value: e.currentTarget.value,
                      label: `${selectedOption?.label}: ${e.currentTarget.value}`,
                    })
                    setOpen(false)
                    setSelectedField(null)
                  }
                }}
              />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// =============================================================================
// SAVED FILTERS DROPDOWN
// =============================================================================

interface SavedFiltersDropdownProps {
  savedFilters: SavedFilter[]
  onApply: (filter: SavedFilter) => void
  onDelete?: (id: string) => void
  currentFilters: FilterValue[]
  onSave?: (name: string) => void
}

function SavedFiltersDropdown({ 
  savedFilters, 
  onApply, 
  onDelete, 
  currentFilters,
  onSave 
}: SavedFiltersDropdownProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')

  const handleSave = () => {
    if (filterName.trim() && onSave) {
      onSave(filterName.trim())
      setFilterName('')
      setSaveDialogOpen(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1">
          <Bookmark className="h-3.5 w-3.5" />
          Saved
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {savedFilters.length === 0 ? (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No saved filters yet
          </div>
        ) : (
          savedFilters.map((filter) => (
            <DropdownMenuItem
              key={filter.id}
              className="flex items-center justify-between"
              onClick={() => onApply(filter)}
            >
              <span className="flex items-center gap-2">
                {filter.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                {filter.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {filter.filters.length}
              </Badge>
            </DropdownMenuItem>
          ))
        )}
        {currentFilters.length > 0 && onSave && (
          <>
            <DropdownMenuSeparator />
            {saveDialogOpen ? (
              <div className="p-2">
                <Input
                  placeholder="Filter name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Save current filters
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CRMQuickFilters({
  filters,
  onFiltersChange,
  filterOptions,
  savedFilters = [],
  onSaveFilter,
  onDeleteSavedFilter,
  onApplySavedFilter,
  className,
}: CRMQuickFiltersProps) {
  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters]
    newFilters.splice(index, 1)
    onFiltersChange(newFilters)
  }

  const handleAddFilter = (filter: FilterValue) => {
    // Replace if same field exists (for non-multiselect)
    const existingIndex = filters.findIndex(f => f.field === filter.field)
    if (existingIndex >= 0 && filter.operator !== 'in') {
      const newFilters = [...filters]
      newFilters[existingIndex] = filter
      onFiltersChange(newFilters)
    } else {
      onFiltersChange([...filters, filter])
    }
  }

  const handleUpdateFilter = (index: number, filter: FilterValue) => {
    const newFilters = [...filters]
    newFilters[index] = filter
    onFiltersChange(newFilters)
  }

  const handleClearAll = () => {
    onFiltersChange([])
  }

  const handleApplySavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters)
    onApplySavedFilter?.(savedFilter)
  }

  const handleSaveFilter = (name: string) => {
    onSaveFilter?.(name, filters)
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Filter Icon */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm">Filters:</span>
      </div>

      {/* Active Filters */}
      <AnimatePresence mode="popLayout">
        {filters.map((filter, index) => (
          <FilterChip
            key={`${filter.field}-${index}`}
            filter={filter}
            filterOptions={filterOptions}
            onRemove={() => handleRemoveFilter(index)}
            onUpdate={(f) => handleUpdateFilter(index, f)}
          />
        ))}
      </AnimatePresence>

      {/* Add Filter */}
      <AddFilterPopover
        filterOptions={filterOptions}
        activeFilters={filters}
        onAddFilter={handleAddFilter}
      />

      {/* Saved Filters */}
      {(savedFilters.length > 0 || filters.length > 0) && (
        <SavedFiltersDropdown
          savedFilters={savedFilters}
          onApply={handleApplySavedFilter}
          onDelete={onDeleteSavedFilter}
          currentFilters={filters}
          onSave={onSaveFilter ? handleSaveFilter : undefined}
        />
      )}

      {/* Clear All */}
      {filters.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-muted-foreground hover:text-foreground"
          onClick={handleClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

// =============================================================================
// PRESET FILTER OPTIONS
// =============================================================================

export const defaultContactFilterOptions: FilterOption[] = [
  {
    id: 'status',
    field: 'status',
    label: 'Status',
    type: 'select',
    icon: <Clock className="h-4 w-4" />,
    options: [
      { value: 'active', label: 'Active', color: '#22c55e' },
      { value: 'inactive', label: 'Inactive', color: '#f59e0b' },
      { value: 'archived', label: 'Archived', color: '#6b7280' },
    ],
  },
  {
    id: 'lead_status',
    field: 'lead_status',
    label: 'Lead Status',
    type: 'select',
    icon: <Star className="h-4 w-4" />,
    options: [
      { value: 'new', label: 'New', color: '#3b82f6' },
      { value: 'contacted', label: 'Contacted', color: '#f59e0b' },
      { value: 'qualified', label: 'Qualified', color: '#22c55e' },
      { value: 'unqualified', label: 'Unqualified', color: '#ef4444' },
      { value: 'converted', label: 'Converted', color: '#8b5cf6' },
    ],
  },
  {
    id: 'company_id',
    field: 'company_id',
    label: 'Company',
    type: 'select',
    icon: <Building2 className="h-4 w-4" />,
    options: [], // Populated dynamically
  },
  {
    id: 'owner_id',
    field: 'owner_id',
    label: 'Owner',
    type: 'select',
    icon: <User className="h-4 w-4" />,
    options: [], // Populated dynamically
  },
  {
    id: 'tags',
    field: 'tags',
    label: 'Tags',
    type: 'multiselect',
    icon: <Tag className="h-4 w-4" />,
    options: [], // Populated dynamically
  },
]

export default CRMQuickFilters
