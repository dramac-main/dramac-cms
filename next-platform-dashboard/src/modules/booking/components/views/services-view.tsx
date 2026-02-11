/**
 * Services View Component
 * 
 * Phase EM-51: Booking Module
 * Displays and manages bookable services
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBooking } from '../../context/booking-context'
import {
  Search,
  MoreHorizontal,
  Plus,
  Clock,
  Coins,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '../../types/booking-types'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface ServicesViewProps {
  onServiceClick?: (service: Service) => void
  onCreateClick?: () => void
  onEditClick?: (service: Service) => void
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatPrice(price: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: currency,
  }).format(price)
}

export function ServicesView({ onServiceClick, onCreateClick, onEditClick }: ServicesViewProps) {
  const {
    services,
    isLoading,
    editService,
    removeService,
    refreshAll,
  } = useBooking()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach((s) => {
      if (s.category) cats.add(s.category)
    })
    return Array.from(cats).sort()
  }, [services])
  
  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = [...services]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((srv) =>
        srv.name.toLowerCase().includes(query) ||
        srv.description?.toLowerCase().includes(query) ||
        srv.category?.toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((srv) =>
        statusFilter === 'active' ? srv.is_active : !srv.is_active
      )
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((srv) => srv.category === categoryFilter)
    }
    
    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    return filtered
  }, [services, searchQuery, statusFilter, categoryFilter])
  
  // Toggle service status
  const handleToggleStatus = async (service: Service) => {
    try {
      await editService(service.id, { is_active: !service.is_active })
      toast.success(`Service ${service.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update service status')
    }
  }
  
  // Delete service
  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return
    try {
      await removeService(service.id)
      toast.success('Service deleted')
    } catch {
      toast.error('Failed to delete service')
    }
  }
  
  return (
    <div className="p-6">
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Services</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Buffer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No services found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow
                    key={service.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => onServiceClick?.(service)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded flex-shrink-0 border border-border"
                          style={{ backgroundColor: service.color }}
                          title={service.color}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{service.name}</span>
                          {service.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Tag className="h-3 w-3" />
                          {service.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(service.duration_minutes)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(service.price ?? 0, service.currency || DEFAULT_CURRENCY)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(service.buffer_before_minutes || 0) + (service.buffer_after_minutes || 0) > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {service.buffer_before_minutes || 0}m / {service.buffer_after_minutes || 0}m
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => handleToggleStatus(service)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onServiceClick?.(service)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onEditClick?.(service)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(service)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredServices.length} of {services.length} services
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Active: {services.filter((s) => s.is_active).length}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              Inactive: {services.filter((s) => !s.is_active).length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
