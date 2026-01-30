"use client"

/**
 * Booking Filter Bar
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Filter controls for booking lists
 */

import * as React from "react"
import { 
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
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
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { AppointmentStatus } from '../../types/booking-types'
import { DateRange } from "react-day-picker"

// =============================================================================
// TYPES
// =============================================================================

export interface BookingFilterBarProps {
  /** Search query */
  searchQuery: string
  /** Search change handler */
  onSearchChange: (query: string) => void
  /** Status filter */
  statusFilter: AppointmentStatus | 'all'
  /** Status filter change handler */
  onStatusChange: (status: string) => void
  /** Service filter */
  serviceFilter?: string
  /** Service filter change handler */
  onServiceChange?: (serviceId: string) => void
  /** Available services */
  services?: { id: string; name: string }[]
  /** Staff filter */
  staffFilter?: string
  /** Staff filter change handler */
  onStaffChange?: (staffId: string) => void
  /** Available staff */
  staff?: { id: string; name: string }[]
  /** Date range filter */
  dateRange?: DateRange
  /** Date range change handler */
  onDateRangeChange?: (range: DateRange | undefined) => void
  /** Sort option */
  sortBy: string
  /** Sort change handler */
  onSortChange: (sort: string) => void
  /** View mode */
  viewMode?: 'grid' | 'list' | 'calendar'
  /** View mode change handler */
  onViewModeChange?: (mode: 'grid' | 'list' | 'calendar') => void
  /** Show view toggle */
  showViewToggle?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// DEBOUNCE HOOK
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BookingFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  serviceFilter = 'all',
  onServiceChange,
  services = [],
  staffFilter = 'all',
  onStaffChange,
  staff = [],
  dateRange,
  onDateRangeChange,
  sortBy,
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = true,
  className,
}: BookingFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  React.useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchQuery, onSearchChange])

  const activeFilterCount = [
    statusFilter !== 'all',
    serviceFilter !== 'all',
    staffFilter !== 'all',
    !!dateRange?.from,
    searchQuery.length > 0,
  ].filter(Boolean).length

  const clearFilters = () => {
    setLocalSearch('')
    onSearchChange('')
    onStatusChange('all')
    onServiceChange?.('all')
    onStaffChange?.('all')
    onDateRangeChange?.(undefined)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('')
                onSearchChange('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>

        {/* Service filter */}
        {onServiceChange && services.length > 0 && (
          <Select value={serviceFilter} onValueChange={onServiceChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Staff filter */}
        {onStaffChange && staff.length > 0 && (
          <Select value={staffFilter} onValueChange={onStaffChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date range picker */}
        {onDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  'Select dates'
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                initialFocus
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_asc">Date (Earliest)</SelectItem>
            <SelectItem value="date_desc">Date (Latest)</SelectItem>
            <SelectItem value="created_desc">Newest First</SelectItem>
            <SelectItem value="created_asc">Oldest First</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        {showViewToggle && onViewModeChange && (
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none rounded-l-md",
                viewMode === 'list' && "bg-muted"
              )}
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none",
                viewMode === 'grid' && "bg-muted"
              )}
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-none rounded-r-md",
                viewMode === 'calendar' && "bg-muted"
              )}
              onClick={() => onViewModeChange('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-3 w-3" />
            Clear
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SERVICE FILTER BAR
// =============================================================================

export interface ServiceFilterBarProps {
  /** Search query */
  searchQuery: string
  /** Search change handler */
  onSearchChange: (query: string) => void
  /** Active filter */
  activeFilter: 'all' | 'active' | 'inactive'
  /** Active filter change handler */
  onActiveChange: (filter: string) => void
  /** Category filter */
  categoryFilter?: string
  /** Category filter change handler */
  onCategoryChange?: (category: string) => void
  /** Available categories */
  categories?: string[]
  /** Sort option */
  sortBy: string
  /** Sort change handler */
  onSortChange: (sort: string) => void
  /** View mode */
  viewMode?: 'grid' | 'list'
  /** View mode change handler */
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** Additional class names */
  className?: string
}

export function ServiceFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onActiveChange,
  categoryFilter = 'all',
  onCategoryChange,
  categories = [],
  sortBy,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  className,
}: ServiceFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  React.useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchQuery, onSearchChange])

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active filter */}
      <Select value={activeFilter} onValueChange={onActiveChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Category filter */}
      {onCategoryChange && categories.length > 0 && (
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
          <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          <SelectItem value="price_asc">Price (Low)</SelectItem>
          <SelectItem value="price_desc">Price (High)</SelectItem>
          <SelectItem value="duration_asc">Duration (Short)</SelectItem>
          <SelectItem value="duration_desc">Duration (Long)</SelectItem>
        </SelectContent>
      </Select>

      {/* View toggle */}
      {onViewModeChange && (
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-none rounded-l-md",
              viewMode === 'grid' && "bg-muted"
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-none rounded-r-md",
              viewMode === 'list' && "bg-muted"
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STAFF FILTER BAR
// =============================================================================

export interface StaffFilterBarProps {
  /** Search query */
  searchQuery: string
  /** Search change handler */
  onSearchChange: (query: string) => void
  /** Active filter */
  activeFilter: 'all' | 'active' | 'inactive'
  /** Active filter change handler */
  onActiveChange: (filter: string) => void
  /** Accepting bookings filter */
  acceptingFilter?: 'all' | 'accepting' | 'not_accepting'
  /** Accepting filter change handler */
  onAcceptingChange?: (filter: string) => void
  /** Sort option */
  sortBy: string
  /** Sort change handler */
  onSortChange: (sort: string) => void
  /** View mode */
  viewMode?: 'grid' | 'list'
  /** View mode change handler */
  onViewModeChange?: (mode: 'grid' | 'list') => void
  /** Additional class names */
  className?: string
}

export function StaffFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onActiveChange,
  acceptingFilter = 'all',
  onAcceptingChange,
  sortBy,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  className,
}: StaffFilterBarProps) {
  const [localSearch, setLocalSearch] = React.useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 300)

  React.useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch)
    }
  }, [debouncedSearch, searchQuery, onSearchChange])

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active filter */}
      <Select value={activeFilter} onValueChange={onActiveChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Accepting bookings filter */}
      {onAcceptingChange && (
        <Select value={acceptingFilter} onValueChange={onAcceptingChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="accepting">Accepting Bookings</SelectItem>
            <SelectItem value="not_accepting">Not Accepting</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
          <SelectItem value="name_desc">Name (Z-A)</SelectItem>
          <SelectItem value="created_desc">Newest First</SelectItem>
          <SelectItem value="created_asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>

      {/* View toggle */}
      {onViewModeChange && (
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-none rounded-l-md",
              viewMode === 'grid' && "bg-muted"
            )}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-none rounded-r-md",
              viewMode === 'list' && "bg-muted"
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
