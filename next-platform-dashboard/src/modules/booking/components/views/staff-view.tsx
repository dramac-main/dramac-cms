/**
 * Staff View Component
 * 
 * Phase EM-51: Booking Module
 * Displays and manages staff members
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  UserCircle,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Staff } from '../../types/booking-types'
import { toast } from 'sonner'

interface StaffViewProps {
  onStaffClick?: (staff: Staff) => void
  onCreateClick?: () => void
  onEditClick?: (staff: Staff) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function StaffView({ onStaffClick, onCreateClick, onEditClick }: StaffViewProps) {
  const {
    staff,
    services,
    isLoading,
    editStaff,
    removeStaff,
    refreshAll,
  } = useBooking()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Get services for a staff member
  const getStaffServices = (staffMember: Staff) => {
    if (!staffMember.services || staffMember.services.length === 0) return []
    return staffMember.services
  }
  
  // Filter staff
  const filteredStaff = useMemo(() => {
    let filtered = [...staff]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.bio?.toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) =>
        statusFilter === 'active' ? s.is_active : !s.is_active
      )
    }
    
    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    return filtered
  }, [staff, searchQuery, statusFilter])
  
  // Toggle staff status
  const handleToggleStatus = async (staffMember: Staff) => {
    try {
      await editStaff(staffMember.id, { is_active: !staffMember.is_active })
      toast.success(`Staff member ${staffMember.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update staff status')
    }
  }
  
  // Delete staff
  const handleDelete = async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to delete "${staffMember.name}"?`)) return
    try {
      await removeStaff(staffMember.id)
      toast.success('Staff member deleted')
    } catch {
      toast.error('Failed to delete staff member')
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Staff Members</CardTitle>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                List
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff members..."
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
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {isLoading ? 'Loading...' : 'No staff members found'}
              </div>
            ) : (
              filteredStaff.map((staffMember) => {
                const staffServices = getStaffServices(staffMember)
                return (
                  <Card
                    key={staffMember.id}
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-shadow',
                      !staffMember.is_active && 'opacity-60'
                    )}
                    onClick={() => onStaffClick?.(staffMember)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={staffMember.avatar_url || undefined} alt={staffMember.name} />
                          <AvatarFallback>{getInitials(staffMember.name)}</AvatarFallback>
                        </Avatar>
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
                              onStaffClick?.(staffMember)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              onEditClick?.(staffMember)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(staffMember)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{staffMember.name}</h3>
                          {staffMember.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {staffMember.bio}
                            </p>
                          )}
                        </div>
                        
                        {staffMember.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{staffMember.email}</span>
                          </div>
                        )}
                        
                        {staffMember.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{staffMember.phone}</span>
                          </div>
                        )}
                        
                        {staffServices.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-2">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            {staffServices.slice(0, 2).map((srv) => (
                              <Badge key={srv.id} variant="secondary" className="text-xs">
                                {srv.name}
                              </Badge>
                            ))}
                            {staffServices.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{staffServices.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Badge
                            variant={staffMember.is_active ? 'default' : 'secondary'}
                            className={cn(
                              staffMember.is_active && 'bg-green-500',
                              !staffMember.is_active && 'bg-gray-400'
                            )}
                          >
                            {staffMember.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={staffMember.is_active}
                            onCheckedChange={() => handleToggleStatus(staffMember)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        ) : (
          /* List View */
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Staff Member</th>
                  <th className="p-3 text-left font-medium">Contact</th>
                  <th className="p-3 text-left font-medium">Services</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {isLoading ? 'Loading...' : 'No staff members found'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staffMember) => {
                    const staffServices = getStaffServices(staffMember)
                    return (
                      <tr
                        key={staffMember.id}
                        className="border-b cursor-pointer hover:bg-accent/50"
                        onClick={() => onStaffClick?.(staffMember)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={staffMember.avatar_url || undefined} alt={staffMember.name} />
                              <AvatarFallback>{getInitials(staffMember.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{staffMember.name}</div>
                              {staffMember.bio && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {staffMember.bio}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {staffMember.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {staffMember.email}
                              </div>
                            )}
                            {staffMember.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {staffMember.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {staffServices.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <>
                                {staffServices.slice(0, 2).map((srv) => (
                                  <Badge key={srv.id} variant="secondary" className="text-xs">
                                    {srv.name}
                                  </Badge>
                                ))}
                                {staffServices.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{staffServices.length - 2}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Switch
                            checked={staffMember.is_active}
                            onCheckedChange={() => handleToggleStatus(staffMember)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-3 text-right">
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
                                onStaffClick?.(staffMember)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                onEditClick?.(staffMember)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(staffMember)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Summary */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredStaff.length} of {staff.length} staff members
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Active: {staff.filter((s) => s.is_active).length}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              Inactive: {staff.filter((s) => !s.is_active).length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
