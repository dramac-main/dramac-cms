"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  X, 
  Calendar, 
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  StopCircle,
  Save,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { ExecutionStatus } from "../../types/automation-types"

export interface ExecutionFilters {
  search?: string
  status?: ExecutionStatus[]
  workflowId?: string
  dateRange?: { from: Date; to: Date }
  sortBy?: 'started_at' | 'duration' | 'status'
  sortOrder?: 'asc' | 'desc'
}

interface ExecutionFilterBarProps {
  onFilterChange: (filters: ExecutionFilters) => void
  workflows?: Array<{ id: string; name: string }>
  initialFilters?: ExecutionFilters
  showSearch?: boolean
  showDateRange?: boolean
  className?: string
}

const statusOptions: Array<{ value: ExecutionStatus; label: string; icon: typeof CheckCircle2; color: string }> = [
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  { value: 'failed', label: 'Failed', icon: XCircle, color: 'text-red-600' },
  { value: 'running', label: 'Running', icon: Loader2, color: 'text-blue-600' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { value: 'cancelled', label: 'Cancelled', icon: StopCircle, color: 'text-muted-foreground' },
]

export function ExecutionFilterBar({
  onFilterChange,
  workflows = [],
  initialFilters = {},
  showSearch = true,
  showDateRange = true,
  className
}: ExecutionFilterBarProps) {
  const [filters, setFilters] = React.useState<ExecutionFilters>(initialFilters)
  const [searchValue, setSearchValue] = React.useState(initialFilters.search || '')
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchValue(value)
    
    if (searchTimeoutRef.current !== null) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: value || undefined }
      setFilters(newFilters)
      onFilterChange(newFilters)
    }, 300)
  }, [filters, onFilterChange])

  // Update filters and notify parent
  const updateFilters = React.useCallback((update: Partial<ExecutionFilters>) => {
    const newFilters = { ...filters, ...update }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }, [filters, onFilterChange])

  // Toggle status filter
  const toggleStatus = React.useCallback((status: ExecutionStatus) => {
    const currentStatuses = filters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    
    updateFilters({ status: newStatuses.length > 0 ? newStatuses : undefined })
  }, [filters.status, updateFilters])

  // Clear all filters
  const clearFilters = React.useCallback(() => {
    setSearchValue('')
    setFilters({})
    onFilterChange({})
  }, [onFilterChange])

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status && filters.status.length > 0) count++
    if (filters.workflowId) count++
    if (filters.dateRange) count++
    if (filters.sortBy) count++
    return count
  }, [filters])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-3", className)}
    >
      {/* Main filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => handleSearchChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Status
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 ml-1">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((option) => {
              const Icon = option.icon
              const isSelected = filters.status?.includes(option.value)
              return (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={isSelected}
                  onCheckedChange={() => toggleStatus(option.value)}
                >
                  <Icon className={cn("w-4 h-4 mr-2", option.color)} />
                  {option.label}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Workflow filter */}
        {workflows.length > 0 && (
          <Select
            value={filters.workflowId || 'all'}
            onValueChange={(value) => updateFilters({ workflowId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workflows</SelectItem>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range filter */}
        {showDateRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                {filters.dateRange ? (
                  <span className="text-xs">
                    {format(filters.dateRange.from, "MMM d")} - {format(filters.dateRange.to, "MMM d")}
                  </span>
                ) : (
                  "Date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined}
                onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                  if (range?.from && range?.to) {
                    updateFilters({ dateRange: { from: range.from, to: range.to } })
                  } else if (!range) {
                    updateFilters({ dateRange: undefined })
                  }
                }}
                numberOfMonths={2}
              />
              {filters.dateRange && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => updateFilters({ dateRange: undefined })}
                  >
                    Clear date range
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {filters.sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => updateFilters({ sortBy: 'started_at', sortOrder: filters.sortBy === 'started_at' && filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
            >
              {filters.sortBy === 'started_at' && (
                filters.sortOrder === 'desc' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />
              )}
              Start time
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => updateFilters({ sortBy: 'duration', sortOrder: filters.sortBy === 'duration' && filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
            >
              {filters.sortBy === 'duration' && (
                filters.sortOrder === 'desc' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />
              )}
              Duration
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => updateFilters({ sortBy: 'status', sortOrder: filters.sortBy === 'status' && filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
            >
              {filters.sortBy === 'status' && (
                filters.sortOrder === 'desc' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />
              )}
              Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active filter badges */}
      <AnimatePresence>
        {(filters.status && filters.status.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {filters.status.map((status) => {
              const option = statusOptions.find(o => o.value === status)
              if (!option) return null
              const Icon = option.icon
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <Icon className={cn("w-3 h-3", option.color)} />
                  {option.label}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => toggleStatus(status)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
