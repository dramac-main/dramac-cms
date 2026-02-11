/**
 * Customer Detail Dialog Component
 * 
 * Phase ECOM-05: Customer Management System
 * 
 * Full customer profile with orders, addresses, notes
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Package,
  Coins,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getCustomerDetail, addCustomerNote } from '../../actions/customer-actions'
import type { CustomerDetailData, CustomerStatus, Order } from '../../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// ============================================================================
// TYPES
// ============================================================================

interface CustomerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  siteId: string
  userId: string
  userName: string
  onViewOrder?: (order: Order) => void
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  active: { 
    label: 'Active', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  inactive: { 
    label: 'Inactive', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
  guest: { 
    label: 'Guest', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency
  }).format(amount / 100)
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  siteId,
  userId,
  userName,
  onViewOrder
}: CustomerDetailDialogProps) {
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Load customer data
  useEffect(() => {
    if (!open || !customerId) return

    async function loadCustomer() {
      setIsLoading(true)
      try {
        const data = await getCustomerDetail(siteId, customerId)
        setCustomer(data)
      } catch (error) {
        console.error('Error loading customer:', error)
        toast.error('Failed to load customer details')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomer()
  }, [open, customerId, siteId])

  // Add note handler
  const handleAddNote = async () => {
    if (!newNote.trim() || !customer) return

    setIsAddingNote(true)
    try {
      const note = await addCustomerNote(customer.id, newNote.trim(), userId, userName)
      if (note) {
        setCustomer({
          ...customer,
          notes: [note, ...customer.notes]
        })
        setNewNote('')
        toast.success('Note added')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  if (isLoading || !customer) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Customer...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusInfo = statusConfig[customer.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={customer.avatar_url} />
              <AvatarFallback className="text-xl">
                {getInitials(customer.first_name, customer.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {customer.first_name} {customer.last_name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
                {customer.is_guest && (
                  <Badge variant="outline" className="text-xs">Guest</Badge>
                )}
                {customer.accepts_marketing && (
                  <Badge variant="outline" className="text-xs">Marketing</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Package className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{customer.orders_count}</div>
              <div className="text-xs text-muted-foreground">Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Coins className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{formatCurrency(customer.total_spent)}</div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Coins className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-2xl font-bold">{formatCurrency(customer.average_order_value)}</div>
              <div className="text-xs text-muted-foreground">Avg Order</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <div className="text-lg font-bold">
                {customer.last_order_date 
                  ? format(new Date(customer.last_order_date), 'MMM d')
                  : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Last Order</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="orders">Orders ({customer.orders_count})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({customer.notes.length})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${customer.email}`} className="hover:text-primary">
                    {customer.email}
                  </a>
                  {customer.email_verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="hover:text-primary">
                      {customer.phone}
                    </a>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Customer since {format(new Date(customer.created_at), 'MMMM d, yyyy')}
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No addresses saved</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {customer.addresses.map((address) => (
                      <div key={address.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{address.label}</span>
                          {address.is_default_billing && (
                            <Badge variant="secondary" className="text-xs">Billing</Badge>
                          )}
                          {address.is_default_shipping && (
                            <Badge variant="secondary" className="text-xs">Shipping</Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-0.5">
                          <div>{address.first_name} {address.last_name}</div>
                          {address.company && <div>{address.company}</div>}
                          <div>{address.address_line_1}</div>
                          {address.address_line_2 && <div>{address.address_line_2}</div>}
                          <div>{address.city}, {address.state} {address.postal_code}</div>
                          <div>{address.country}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Groups & Tags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Groups & Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Groups</div>
                  {customer.groups.length === 0 ? (
                    <p className="text-sm italic">No groups assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customer.groups.map((group) => (
                        <Badge 
                          key={group.id}
                          style={{ backgroundColor: group.color }}
                          className="text-white"
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tags</div>
                  {customer.tags.length === 0 ? (
                    <p className="text-sm italic">No tags</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            <ScrollArea className="h-[400px]">
              {customer.recent_orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <div className="space-y-3">
                  {customer.recent_orders.map((order) => (
                    <div 
                      key={order.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onViewOrder?.(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Order #{order.order_number}</div>
                        <Badge variant="secondary">{order.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(order.total, order.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Add Note Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isAddingNote}
                >
                  {isAddingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
            </div>

            <Separator />

            {/* Notes List */}
            <ScrollArea className="h-[300px]">
              {customer.notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No notes yet
                </div>
              ) : (
                <div className="space-y-4">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>by {note.user_name}</span>
                        <span>
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
