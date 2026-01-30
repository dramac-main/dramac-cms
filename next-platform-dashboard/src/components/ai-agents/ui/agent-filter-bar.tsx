"use client"

/**
 * Agent Filter Bar Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Search, filter, and sort controls for agent lists
 */

import * as React from "react"
import { 
  Search, 
  Filter,
  X,
  SlidersHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// =============================================================================
// TYPES
// =============================================================================

export type AgentSortOption = 'name' | 'created' | 'runs' | 'success_rate' | 'last_run'
export type AgentStatusFilter = 'all' | 'active' | 'inactive' | 'error' | 'paused'
export type AgentTypeFilter = 'all' | 'assistant' | 'specialist' | 'orchestrator' | 'analyst' | 'guardian'

export interface AgentFilterState {
  search: string
  status: AgentStatusFilter[]
  types: AgentTypeFilter[]
  sortBy: AgentSortOption
  sortOrder: 'asc' | 'desc'
}

export interface AgentFilterBarProps {
  filters: AgentFilterState
  onFiltersChange: (filters: AgentFilterState) => void
  className?: string
  showTypeFilter?: boolean
  showSortOptions?: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS: { value: AgentStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'paused', label: 'Paused' },
  { value: 'error', label: 'Error' },
]

const TYPE_OPTIONS: { value: AgentTypeFilter; label: string }[] = [
  { value: 'assistant', label: 'Assistant' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'orchestrator', label: 'Orchestrator' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'guardian', label: 'Guardian' },
]

const SORT_OPTIONS: { value: AgentSortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Created Date' },
  { value: 'runs', label: 'Total Runs' },
  { value: 'success_rate', label: 'Success Rate' },
  { value: 'last_run', label: 'Last Run' },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentFilterBar({
  filters,
  onFiltersChange,
  className,
  showTypeFilter = true,
  showSortOptions = true,
}: AgentFilterBarProps) {
  const [searchValue, setSearchValue] = React.useState(filters.search)
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value })
    }, 300)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleStatusToggle = (status: AgentStatusFilter) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const handleTypeToggle = (type: AgentTypeFilter) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFiltersChange({ ...filters, types: newTypes })
  }

  const handleClearFilters = () => {
    setSearchValue('')
    onFiltersChange({
      search: '',
      status: [],
      types: [],
      sortBy: 'name',
      sortOrder: 'asc',
    })
  }

  const activeFilterCount = 
    filters.status.length + 
    filters.types.length + 
    (filters.search ? 1 : 0)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status.includes(option.value)}
                        onCheckedChange={() => handleStatusToggle(option.value)}
                      />
                      <Label 
                        htmlFor={`status-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              {showTypeFilter && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Agent Type</Label>
                    <div className="space-y-2">
                      {TYPE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${option.value}`}
                            checked={filters.types.includes(option.value)}
                            onCheckedChange={() => handleTypeToggle(option.value)}
                          />
                          <Label 
                            htmlFor={`type-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Clear Button */}
              {activeFilterCount > 0 && (
                <>
                  <Separator />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={handleClearFilters}
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Options */}
        {showSortOptions && (
          <div className="flex gap-2">
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => 
                onFiltersChange({ ...filters, sortBy: value as AgentSortOption })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => 
                onFiltersChange({ 
                  ...filters, 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })
              }
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button onClick={() => handleSearchChange('')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find(o => o.value === status)?.label}
              <button onClick={() => handleStatusToggle(status)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.types.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {TYPE_OPTIONS.find(o => o.value === type)?.label}
              <button onClick={() => handleTypeToggle(type)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={handleClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}

export default AgentFilterBar
