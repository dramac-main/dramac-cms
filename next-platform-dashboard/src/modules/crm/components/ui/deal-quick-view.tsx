/**
 * Deal Quick View Component
 * 
 * PHASE-UI-10B: CRM Pipeline & Deals View
 * 
 * Enhanced deal preview panel with tabbed interface for quick access
 * to deal details, activities, and related records.
 */
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
  Activity,
  Link,
  ExternalLink,
  Plus,
  MoreHorizontal,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal, Activity as CRMActivity, Contact, Company } from '../../types/crm-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export interface DealQuickViewProps {
  deal: Deal | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (deal: Deal) => void
  onDelete?: (deal: Deal) => void
  onWin?: (deal: Deal) => void
  onLose?: (deal: Deal) => void
  onAddActivity?: (deal: Deal) => void
  onAddNote?: (deal: Deal) => void
  activities?: CRMActivity[]
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return formatDate(date)
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getContactFullName(contact: Contact): string {
  return [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'
}

function getDaysUntilClose(closeDate?: string | null): number | null {
  if (!closeDate) return null
  const close = new Date(closeDate)
  const now = new Date()
  return Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getStatusColor(status: Deal['status']): string {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'won': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return ''
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DealHeader({ 
  deal, 
  onClose, 
  onEdit, 
  onDelete, 
  onWin, 
  onLose 
}: { 
  deal: Deal
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  onWin?: () => void
  onLose?: () => void
}) {
  const daysUntilClose = getDaysUntilClose(deal.expected_close_date)
  const isOverdue = daysUntilClose !== null && daysUntilClose < 0
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-tight">{deal.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge className={cn("font-medium", getStatusColor(deal.status))}>
              {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
            </Badge>
            <span>•</span>
            <span>{deal.pipeline?.name || 'Default Pipeline'}</span>
            <span>•</span>
            <span>{deal.stage?.name || 'Unknown Stage'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {deal.status === 'open' && (
            <>
              {onWin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-emerald-600 hover:bg-emerald-100" onClick={onWin}>
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as won</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onLose && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100" onClick={onLose}>
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as lost</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}
          
          {onEdit && (
            <Button size="icon" variant="ghost" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Deal Value & Probability */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Deal Value</p>
          <p className="text-2xl font-bold">{formatCurrency(deal.amount || 0)}</p>
          <p className="text-xs text-muted-foreground">
            Weighted: {formatCurrency(deal.weighted_value || 0)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Win Probability</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{deal.probability || 0}%</span>
          </div>
          <Progress value={deal.probability || 0} className="h-2" />
        </div>
      </div>

      {/* Close Date Warning */}
      {deal.expected_close_date && deal.status === 'open' && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm",
          isOverdue 
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
            : daysUntilClose !== null && daysUntilClose <= 7
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-muted"
        )}>
          {isOverdue ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span>
            {isOverdue 
              ? `Overdue by ${Math.abs(daysUntilClose!)} days`
              : `Expected close: ${formatDate(deal.expected_close_date)} (${daysUntilClose} days)`
            }
          </span>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ deal }: { deal: Deal }) {
  const contact = deal.contact
  const company = deal.company
  const contactFullName = contact ? getContactFullName(contact) : ''
  
  return (
    <div className="space-y-6 py-4">
      {/* Contact Info */}
      {contact && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Contact
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={undefined} />
              <AvatarFallback>{getInitials(contactFullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{contactFullName}</p>
              <p className="text-sm text-muted-foreground truncate">{contact.job_title || 'No title'}</p>
            </div>
            <div className="flex gap-1">
              {contact.email && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" asChild>
                        <a href={`mailto:${contact.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{contact.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {contact.phone && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" asChild>
                        <a href={`tel:${contact.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{contact.phone}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Info */}
      {company && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              <AvatarImage src={undefined} />
              <AvatarFallback>{getInitials(company.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{company.name}</p>
              <p className="text-sm text-muted-foreground truncate">{company.industry || 'No industry'}</p>
            </div>
            {company.website && (
              <Button size="icon" variant="ghost" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {deal.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {deal.description && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Description
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {deal.description}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Details
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p>{formatDate(deal.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Updated</p>
            <p>{formatDate(deal.updated_at)}</p>
          </div>
          {deal.actual_close_date && (
            <div>
              <p className="text-muted-foreground">Closed</p>
              <p>{formatDate(deal.actual_close_date)}</p>
            </div>
          )}
          {deal.owner_id && (
            <div>
              <p className="text-muted-foreground">Owner</p>
              <p>Assigned</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ActivitiesTab({ 
  activities, 
  onAddActivity 
}: { 
  activities: CRMActivity[]
  onAddActivity?: () => void 
}) {
  return (
    <div className="space-y-4 py-4">
      {onAddActivity && (
        <Button onClick={onAddActivity} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      )}
      
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activities yet</p>
          {onAddActivity && (
            <Button size="sm" variant="link" onClick={onAddActivity}>
              Add the first activity
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{activity.activity_type}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.description || 'No description'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NotesTab({ deal, onAddNote }: { deal: Deal; onAddNote?: () => void }) {
  // Placeholder for notes - would come from deal.notes or a separate query
  const notes: Array<{ id: string; content: string; created_at: string }> = []
  
  return (
    <div className="space-y-4 py-4">
      {onAddNote && (
        <Button onClick={onAddNote} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      )}
      
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
          {onAddNote && (
            <Button size="sm" variant="link" onClick={onAddNote}>
              Add the first note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatRelativeTime(note.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DealQuickView({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onWin,
  onLose,
  onAddActivity,
  onAddNote,
  activities = [],
  className,
}: DealQuickViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!deal) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={cn("w-full sm:max-w-lg overflow-hidden flex flex-col", className)}>
        <SheetHeader className="sr-only">
          <SheetTitle>{deal.name}</SheetTitle>
          <SheetDescription>Deal details and activities</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <DealHeader
            deal={deal}
            onClose={onClose}
            onEdit={onEdit ? () => onEdit(deal) : undefined}
            onDelete={onDelete ? () => onDelete(deal) : undefined}
            onWin={onWin ? () => onWin(deal) : undefined}
            onLose={onLose ? () => onLose(deal) : undefined}
          />

          <Separator className="my-4" />

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">
                Activities
                {activities.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activities.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab deal={deal} />
              </TabsContent>
              
              <TabsContent value="activities" className="mt-0">
                <ActivitiesTab 
                  activities={activities}
                  onAddActivity={onAddActivity ? () => onAddActivity(deal) : undefined}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="mt-0">
                <NotesTab 
                  deal={deal}
                  onAddNote={onAddNote ? () => onAddNote(deal) : undefined}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default DealQuickView
